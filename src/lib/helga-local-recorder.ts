/**
 * Dual capture for a Helga web call.
 *
 * `bland-client-js-sdk@2.1.2` `useWebchat` is WebSocket + PCM16, not a
 * PeerConnection. It has no recording hook. Mic capture (`micStream`) and
 * agent playback (`playPcm`) are private. Binary WebSocket frames are the
 * bytes `playPcm` schedules; text frames are JSON events.
 *
 * This module keeps our own live `MediaStream` (the SDK opens a second mic
 * for uplink) and taps those binary frames after `start()` assigns the
 * runtime `websocket` field. The live tap uses the device sample rate and a
 * silent `MediaStreamDestination` — it does not force 16 kHz and does not
 * connect to `AudioContext.destination`, which would contend with Bland's
 * playback clock and stretch `playPcm`.
 *
 * `playPcm` (bland-client-js-sdk@2.1.2, `dist/webchat-C1CDI_H8.mjs`) schedules
 * each binary frame at `downstreamSampleRate || audioContext.sampleRate`.
 * `downstreamSampleRate` starts null. On socket open the SDK copies
 * `playbackSampleRate || ttsSampleRate || sampleRate` from the start config.
 * A JSON text frame can overwrite it from `playbackSampleRate ?? sample_rate
 * ?? sampleRate ?? pcm_sample_rate`. Helga does not pass `sampleRate`, so
 * when no JSON rate arrives the buffer rate is the device `AudioContext`
 * (commonly 48 kHz), not 16 kHz. `webchat.stop()` nulls that context in
 * `teardownAudio` before this recorder mixes, so the device rate is sampled
 * while frames are still arriving.
 *
 * The recorded agent rate is the clock `playPcm` actually passed to
 * `createBuffer`: `downstreamSampleRate || audioContext.sampleRate`. Both are
 * sampled on every agent frame and kept as numbers, because `webchat.stop()` /
 * `teardownAudio` runs before `recorder.stop()` and clears Bland's context.
 * The recorder's own device `AudioContext` is that same clock when Bland's
 * context was already torn down. Mic samples use the recorder clock only.
 *
 * A 16 kHz downstream or JSON pin is not that clock when the device rate or
 * the in-burst sample clock is about 3× faster. Bland can publish 16000 while
 * the binary frames are still device-rate PCM, which is why a saved call was
 * slow and deep while live playback stayed normal. The pin still wins when the
 * burst clock agrees with it, so a real 16 kHz stream on a 48 kHz device is
 * not sped up. Slices stay unlabeled until a playback clock or the burst
 * estimate exists; 16 kHz is only the last resort when the call ends with
 * no clock at all. `estimateAgentSampleRate` sums in-burst gaps only, so a
 * pause cannot snap 48 kHz PCM down to 16 kHz. On stop, each side is
 * resampled to 16 kHz on its own rate and encoded as WAV.
 *
 * Placement is a playback cursor, not wall-clock receive time. `playPcm`
 * queues each frame on `nextPlaybackTime` and only snaps when that cursor
 * has fallen behind. Receive-time placement left a silence hole in every
 * gap once packets stopped being stretched ~3× (the slow voice). See
 * `placeAgentSegments`.
 *
 * Bland web `recording_url` is not used. The listen-adapter spike failed.
 */

import { readPcmSampleRate } from "./helga-recording-join.ts";

export const HELGA_MIX_RATE = 16_000;

/**
 * Rates `playPcm` will schedule: telephony 16/24 kHz, or a default device
 * `AudioContext` (44.1 or 48 kHz). The stop-time heuristic snaps to these.
 */
export const HELGA_AGENT_RATE_CANDIDATES = [16_000, 24_000, 44_100, 48_000] as const;

/**
 * One 20 ms packet of jitter cannot separate 16 kHz from 24 kHz. Spans shorter
 * than this are not a clock.
 */
const MIN_AGENT_RATE_SPAN_MS = 200;

/**
 * Inter-arrival times longer than this are silence between turns, not the PCM
 * clock. Counting them stretches the span and snaps a 48 kHz stream to 16 kHz.
 */
const MAX_BURST_GAP_MS = 150;

/**
 * A JSON hint this far from the burst estimate is not the playback clock.
 * 16 kHz versus 48 kHz is 200%; 44.1 kHz versus 48 kHz stays inside the band.
 */
const RATE_DISAGREE_RATIO = 0.2;

const MAX_SECONDS = 150;

export function pcm16ToFloat32(pcm: Uint8Array): Float32Array {
  const even = pcm.byteLength - (pcm.byteLength % 2);
  const view = new DataView(pcm.buffer, pcm.byteOffset, even);
  const out = new Float32Array(even / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = view.getInt16(i * 2, true) / 32768;
  return out;
}

export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (input.length === 0) return new Float32Array();
  if (fromRate === toRate || fromRate <= 0 || toRate <= 0) return input;
  const outLength = Math.max(1, Math.round((input.length * toRate) / fromRate));
  const out = new Float32Array(outLength);
  const scale = fromRate / toRate;
  const last = input.length - 1;
  for (let i = 0; i < outLength; i += 1) {
    const pos = i * scale;
    const i0 = Math.min(last, Math.floor(pos));
    const i1 = Math.min(last, i0 + 1);
    const frac = pos - i0;
    out[i] = input[i0] + (input[i1] - input[i0]) * frac;
  }
  return out;
}

export type PcmSegment = { startSample: number; samples: Float32Array };

export function mixSegments(mic: Float32Array, agent: readonly PcmSegment[]): Float32Array {
  let total = mic.length;
  for (const segment of agent) {
    total = Math.max(total, segment.startSample + segment.samples.length);
  }
  const out = new Float32Array(total);
  out.set(mic.subarray(0, out.length));
  for (const segment of agent) {
    for (let i = 0; i < segment.samples.length; i += 1) {
      const at = segment.startSample + i;
      if (at < 0 || at >= out.length) continue;
      const mixed = out[at] + segment.samples[i];
      out[at] = Math.max(-1, Math.min(1, mixed));
    }
  }
  return out;
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}

export type AgentPcmSlice = {
  atMs: number;
  pcm: Uint8Array;
  sampleRate: number;
};

/**
 * Infer an agent PCM rate when Bland never published one and `playPcm`'s
 * `audioContext` was never observed.
 *
 * Placeholder slices are 16 kHz, so a 24 or 48 kHz stream mixed that way is
 * written too long and sounds deep and slow. Sample count divided by the
 * in-burst span recovers the rate those bytes were produced at:
 *
 * - Gaps of at most {@link MAX_BURST_GAP_MS} are summed. That is the speech
 *   clock: a pause between turns is left out, so it cannot pull 48 kHz down
 *   to 16 kHz. The last packet of each burst (about 20 ms) is omitted;
 *   snapping absorbs it.
 * - When every gap is inside a burst and that sum is under 200 ms, the span
 *   is the call duration (`stop` minus `start`). A single packet still has a
 *   clock. A call that already discarded a long pause does not fall back to
 *   wall clock — that span is the biased one.
 *
 * The ratio snaps to the nearest of 16000, 24000, 44100, and 48000. Returns
 * null when there is no PCM or the span is under 200 ms.
 */
export function estimateAgentSampleRate(
  slices: readonly { atMs: number; pcm: Uint8Array }[],
  callDurationMs: number,
): number | null {
  let totalSamples = 0;
  for (const slice of slices) totalSamples += Math.floor(slice.pcm.byteLength / 2);
  if (totalSamples <= 0) return null;

  let burstSpanMs = 0;
  let discardedPause = false;
  for (let i = 1; i < slices.length; i += 1) {
    const gap = slices[i].atMs - slices[i - 1].atMs;
    if (gap <= 0) continue;
    if (gap <= MAX_BURST_GAP_MS) burstSpanMs += gap;
    else discardedPause = true;
  }

  let spanMs = burstSpanMs;
  if (spanMs < MIN_AGENT_RATE_SPAN_MS && !discardedPause) spanMs = callDurationMs;
  if (!(spanMs >= MIN_AGENT_RATE_SPAN_MS)) return null;

  return snapAgentSampleRate(totalSamples / (spanMs / 1000));
}

function snapAgentSampleRate(estimated: number): number {
  let best: number = HELGA_AGENT_RATE_CANDIDATES[0];
  let bestDistance = Infinity;
  for (const candidate of HELGA_AGENT_RATE_CANDIDATES) {
    const distance = Math.abs(estimated - candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

function ratesDisagree(left: number, right: number): boolean {
  const low = Math.min(left, right);
  const high = Math.max(left, right);
  return low > 0 && (high - low) / low > RATE_DISAGREE_RATIO;
}

/**
 * 16 kHz against 44.1 or 48 kHz is about 3×. 24 kHz against 48 kHz is only 2×
 * and can be the rate `playPcm` passed to `createBuffer`, so it is kept.
 */
const PIN_VERSUS_CLOCK_RATIO = 2.5;

function clockIsAboutThreeTimes(clock: number, pin: number): boolean {
  return pin > 0 && clock / pin >= PIN_VERSUS_CLOCK_RATIO;
}

export type AgentRateSource = "downstream" | "context" | "estimate" | "json";

/**
 * Label for agent PCM, matching the rate `playPcm` used for those frames.
 *
 * Downstream wins when it agrees with the bytes. It loses when the burst
 * clock, or the device clock if the burst cannot be measured yet, is about
 * 3× faster — a 16 kHz pin on device-rate PCM. An honest 16 kHz stream stays
 * at 16 kHz when the burst clock agrees with the pin, even if the device
 * `AudioContext` is 48 kHz.
 */
export function chooseAgentPlaybackRate(input: {
  downstream: number | null;
  context: number | null;
  estimated: number | null;
  json: number | null;
}): { rate: number; source: AgentRateSource } | null {
  const { downstream, context, estimated, json } = input;
  const pinIsLie = (pin: number): boolean => {
    if (estimated != null) return clockIsAboutThreeTimes(estimated, pin);
    return context != null && clockIsAboutThreeTimes(context, pin);
  };

  if (downstream != null && !pinIsLie(downstream)) {
    return { rate: downstream, source: "downstream" };
  }
  if (context != null && !pinIsLie(context)) {
    return { rate: context, source: "context" };
  }
  if (estimated != null && (json == null || ratesDisagree(json, estimated))) {
    return { rate: estimated, source: "estimate" };
  }
  if (json != null && !pinIsLie(json)) {
    return { rate: json, source: "json" };
  }
  if (estimated != null) return { rate: estimated, source: "estimate" };
  return null;
}

/**
 * Silence longer than this, measured past the wall-clock end of audio already
 * queued, is a turn. Anything shorter is receive skew against the `playPcm`
 * queue and is closed.
 *
 * 120 ms sits in the 80–150 ms band. A 20 ms frame that arrives on a 60 ms
 * wall clock (about 3× the true duration — the hole left after the rate fix)
 * leaves a 40 ms gap, so one turn stays contiguous. A multi-hundred-ms gap
 * between turns still jumps the cursor. `playPcm`'s queue lead is 150 ms;
 * this threshold does not add that lead back onto a real pause.
 */
export const AGENT_PAUSE_THRESHOLD_MS = 120;

/**
 * Place agent PCM the way `playPcm` queues it.
 *
 * Slices stay in arrival order (`atMs`, then the order they were passed).
 * Each one is resampled to `mixRate` and written at `cursor`, then `cursor`
 * advances by that length. Frames inside a turn are back-to-back.
 *
 * The pause check is not `wallPos > cursor + threshold`. After a run of short
 * frames the packed cursor lags the receive clock by the sum of the holes, so
 * that test would reopen a gap every time the lag crossed 120 ms and the
 * chop would come back. The check uses the wall-clock end of audio already
 * queued (`wallEnd`): the gap that receive-time placement would have
 * inserted. A same-millisecond burst accumulates into `wallEnd`, so those
 * frames queue instead of stacking on one sample.
 */
export function placeAgentSegments(
  slices: readonly AgentPcmSlice[],
  mixRate: number,
): PcmSegment[] {
  const ordered = slices.slice().sort((left, right) => left.atMs - right.atMs);
  const pauseThresholdSamples = Math.round((AGENT_PAUSE_THRESHOLD_MS / 1000) * mixRate);
  const segments: PcmSegment[] = [];
  let cursor = 0;
  let wallEnd = 0;
  for (const slice of ordered) {
    const samples = resampleLinear(pcm16ToFloat32(slice.pcm), slice.sampleRate, mixRate);
    const wallPos = Math.max(0, Math.round((slice.atMs / 1000) * mixRate));
    if (wallPos > wallEnd + pauseThresholdSamples) cursor = wallPos;
    segments.push({ startSample: cursor, samples });
    cursor += samples.length;
    wallEnd = Math.max(wallEnd, wallPos) + samples.length;
  }
  return segments;
}

export function mixCallToWav(input: {
  mic: Float32Array;
  micSampleRate: number;
  agent: readonly AgentPcmSlice[];
  mixRate?: number;
}): Uint8Array {
  const mixRate = input.mixRate ?? HELGA_MIX_RATE;
  const mic = resampleLinear(input.mic, input.micSampleRate, mixRate);
  const segments = placeAgentSegments(input.agent, mixRate);
  const mixed = mixSegments(mic, segments);
  const cap = mixRate * MAX_SECONDS;
  return encodeWav(mixed.length > cap ? mixed.subarray(0, cap) : mixed, mixRate);
}

const MIC_WORKLET = `
class HelgaMicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      const copy = new Float32Array(channel.length);
      copy.set(channel);
      this.port.postMessage(copy.buffer, [copy.buffer]);
    }
    return true;
  }
}
registerProcessor("helga-mic", HelgaMicProcessor);
`;

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof globalThis.AudioContext === "function") return globalThis.AudioContext;
  const webkit = (globalThis as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  return typeof webkit === "function" ? webkit : null;
}

export type HelgaPcmSink = {
  pushAgentPcm(frame: Uint8Array): void;
  setAgentSampleRate(rate: number): void;
};

export type HelgaLocalRecorder = HelgaPcmSink & {
  start(): Promise<void>;
  stop(): Promise<Blob>;
};

export type HelgaLocalRecorderOptions = {
  /**
   * Bland webchat. `downstreamSampleRate` labels agent PCM in the mix only.
   * It is never copied onto a live playback `AudioContext`.
   */
  webchat?: object;
};

export function createHelgaLocalRecorder(
  mic: MediaStream,
  options?: HelgaLocalRecorderOptions,
): HelgaLocalRecorder {
  let running = false;
  let stopped = false;
  let startedAt = 0;
  // Unset until a playback clock or the burst estimate exists. 16 kHz here
  // would freeze device-rate PCM when no later clock got a chance to rewrite.
  let agentRate: number | null = null;
  // Last rates seen while the call was open. `webchat.stop()` nulls Bland's
  // context before `recorder.stop()`, so these numbers outlive teardown.
  let seenDownstream: number | null = null;
  let seenContext: number | null = null;
  let observedDeviceRate: number | null = null;
  let jsonRate: number | null = null;
  let agentRateSource: AgentRateSource | null = null;
  let micRate = HELGA_MIX_RATE;
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let silent: MediaStreamAudioDestinationNode | null = null;
  const micChunks: Float32Array[] = [];
  const agent: AgentPcmSlice[] = [];
  let lastBlob: Blob | null = null;

  const rememberPlaybackRates = () => {
    if (!options?.webchat) return;
    const downstream = readDownstreamRate(options.webchat);
    if (downstream) seenDownstream = downstream;
    const contextRate = readAudioContextRate(options.webchat);
    if (contextRate) seenContext = contextRate;
  };

  /**
   * Label every slice at the rate `playPcm` is using for these frames.
   * Mic capture is not touched. A later clock rewrites slices already stored,
   * including ones that arrived before any rate was known.
   */
  const reconcileAgentRate = () => {
    rememberPlaybackRates();
    const estimated = estimateAgentSampleRate(agent, Math.max(0, Date.now() - startedAt));
    const chosen = chooseAgentPlaybackRate({
      downstream: seenDownstream,
      context: seenContext ?? observedDeviceRate,
      estimated,
      json: jsonRate,
    });
    if (!chosen) return;
    const unlabeled = agent.some((slice) => slice.sampleRate !== chosen.rate);
    if (agentRate === chosen.rate && agentRateSource === chosen.source && !unlabeled) return;
    for (const slice of agent) slice.sampleRate = chosen.rate;
    agentRate = chosen.rate;
    agentRateSource = chosen.source;
  };

  const onMic = (event: MessageEvent) => {
    if (!running) return;
    const raw: unknown = event.data;
    const frame =
      raw instanceof Float32Array ? raw : raw instanceof ArrayBuffer ? new Float32Array(raw) : null;
    if (!frame) return;
    let used = 0;
    for (const chunk of micChunks) used += chunk.length;
    const room = micRate * MAX_SECONDS - used;
    if (room <= 0) return;
    micChunks.push(frame.length > room ? frame.subarray(0, room) : frame);
  };

  return {
    async start() {
      if (running || stopped) return;
      startedAt = Date.now();
      running = true;
      reconcileAgentRate();
      const Ctor = audioContextCtor();
      if (!Ctor || typeof mic.getAudioTracks !== "function") return;
      try {
        try {
          context = new Ctor({ latencyHint: "interactive" });
        } catch {
          context = new Ctor();
        }
        const device = context.sampleRate;
        if (typeof device === "number" && device > 0) micRate = device;
        // Only a rate `playPcm` can schedule. A missing context must not
        // become a fake 16 kHz device clock.
        if (typeof device === "number" && device >= 8000 && device <= 48000) {
          observedDeviceRate = device;
        }
        reconcileAgentRate();
        const url = URL.createObjectURL(
          new Blob([MIC_WORKLET], { type: "application/javascript" }),
        );
        try {
          await context.audioWorklet.addModule(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        worklet = new AudioWorkletNode(context, "helga-mic");
        worklet.port.onmessage = onMic;
        source = context.createMediaStreamSource(mic);
        // A media-stream sink keeps the worklet pulling without opening the
        // speakers. Gain 0 into `destination` still shares the device clock.
        silent = context.createMediaStreamDestination();
        source.connect(worklet);
        worklet.connect(silent);
        await context.resume();
      } catch {
        console.error("[helga] mic tap failed");
      }
    },
    pushAgentPcm(frame: Uint8Array) {
      if (!running || frame.byteLength < 2) return;
      reconcileAgentRate();
      let used = 0;
      for (const slice of agent) used += slice.pcm.byteLength / 2;
      // Cap at the highest playPcm rate. A wrong early 16 kHz pin must not
      // cut a device-rate call off at a third of its budget.
      const capRate = Math.max(
        agentRate ?? 0,
        HELGA_AGENT_RATE_CANDIDATES[HELGA_AGENT_RATE_CANDIDATES.length - 1],
      );
      if (used >= capRate * MAX_SECONDS) return;
      const copy = new Uint8Array(frame.byteLength);
      copy.set(frame);
      agent.push({
        atMs: Math.max(0, Date.now() - startedAt),
        pcm: copy,
        sampleRate: agentRate ?? 0,
      });
    },
    setAgentSampleRate(rate: number) {
      if (rate < 8000 || rate > 48000) return;
      jsonRate = rate;
      reconcileAgentRate();
    },
    async stop() {
      if (lastBlob) return lastBlob;
      running = false;
      stopped = true;
      reconcileAgentRate();
      if (agentRate == null) {
        agentRate = HELGA_MIX_RATE;
        for (const slice of agent) slice.sampleRate = agentRate;
      }
      console.debug(
        "[helga] agentRate",
        agentRate,
        agentRateSource ?? "unset",
        seenDownstream,
        seenContext ?? observedDeviceRate,
      );
      if (worklet) worklet.port.onmessage = null;
      try {
        source?.disconnect();
      } catch {
        /* already stopped */
      }
      try {
        worklet?.disconnect();
      } catch {
        /* already stopped */
      }
      try {
        silent?.disconnect();
      } catch {
        /* already stopped */
      }
      const closing = context;
      context = null;
      if (closing) {
        try {
          await closing.close();
        } catch {
          /* already closed */
        }
      }
      let micLength = 0;
      for (const chunk of micChunks) micLength += chunk.length;
      const mic = new Float32Array(micLength);
      let offset = 0;
      for (const chunk of micChunks) {
        mic.set(chunk, offset);
        offset += chunk.length;
      }
      const wav = mixCallToWav({ mic, micSampleRate: micRate, agent });
      const copy = new Uint8Array(wav.byteLength);
      copy.set(wav);
      lastBlob = new Blob([copy], { type: "audio/wav" });
      return lastBlob;
    },
  };
}

type SocketLike = {
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
};

export type HelgaWebchatLike = {
  on(event: string, handler: (data: unknown) => void): () => void;
};

function isSocket(value: unknown): value is SocketLike {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.addEventListener === "function" &&
    typeof record.removeEventListener === "function"
  );
}

/** Runtime field. Typed private on the SDK; present after `start()`. */
export function readWebchatSocket(webchat: object): SocketLike | null {
  const record = webchat as Record<string, unknown>;
  for (const field of ["websocket", "ws"]) {
    if (isSocket(record[field])) return record[field];
  }
  return null;
}

function copyPcmFrame(data: unknown): Uint8Array | null {
  if (data instanceof ArrayBuffer) {
    if (data.byteLength < 2) return null;
    return new Uint8Array(data.slice(0));
  }
  if (ArrayBuffer.isView(data)) {
    if (data.byteLength < 2) return null;
    const copy = new Uint8Array(data.byteLength);
    copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return copy;
  }
  return null;
}

function readDownstreamRate(webchat: object): number | null {
  const value = (webchat as { downstreamSampleRate?: unknown }).downstreamSampleRate;
  if (typeof value === "number" && value >= 8000 && value <= 48000) return value;
  return null;
}

/** `playPcm`'s fallback clock. Absent after `teardownAudio`. */
function readAudioContextRate(webchat: object): number | null {
  const audioContext = (webchat as { audioContext?: { sampleRate?: unknown } | null }).audioContext;
  if (!audioContext) return null;
  const rate = audioContext.sampleRate;
  if (typeof rate === "number" && rate >= 8000 && rate <= 48000) return rate;
  return null;
}

/**
 * Listen for agent PCM on the SDK socket without replacing `onmessage`, so
 * playback keeps working. String frames are left to the SDK.
 */
export function attachHelgaAgentPcm(webchat: HelgaWebchatLike, sink: HelgaPcmSink): () => void {
  let socket: SocketLike | null = null;
  let listener: ((event: { data: unknown }) => void) | null = null;

  const publishRate = (message: unknown) => {
    const fromJson = readPcmSampleRate(message);
    if (fromJson) {
      // The SDK copies this onto `downstreamSampleRate` before `message` when
      // the key is one it understands. A later downstream or device rate must
      // still be published — a 16 kHz JSON hint is not final.
      sink.setAgentSampleRate(fromJson);
      return;
    }
    const downstream = readDownstreamRate(webchat);
    if (downstream) sink.setAgentSampleRate(downstream);
  };

  const bind = () => {
    if (listener) return;
    const next = readWebchatSocket(webchat);
    if (!next) return;
    socket = next;
    listener = (event) => {
      const frame = copyPcmFrame(event.data);
      if (!frame) return;
      publishRate(null);
      sink.pushAgentPcm(frame);
    };
    socket.addEventListener("message", listener);
  };

  bind();
  publishRate(null);
  const offOpen = webchat.on("open", () => {
    bind();
    publishRate(null);
  });
  const offMessage = webchat.on("message", publishRate);

  return () => {
    offOpen();
    offMessage();
    if (socket && listener) socket.removeEventListener("message", listener);
    listener = null;
  };
}
