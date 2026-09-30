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
 * playback clock and stretch `playPcm`. Agent PCM is labeled from
 * `downstreamSampleRate` or a JSON rate (`playbackSampleRate` /
 * `sample_rate` / `sampleRate` / `pcm_sample_rate`). On stop, both sides are
 * resampled to 16 kHz and encoded as WAV. v1 favors a working mix over studio
 * quality.
 *
 * Bland web `recording_url` is not used. The listen-adapter spike failed.
 */

import { readPcmSampleRate } from "./helga-recording-join.ts";

export const HELGA_MIX_RATE = 16_000;
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

export function mixCallToWav(input: {
  mic: Float32Array;
  micSampleRate: number;
  agent: readonly AgentPcmSlice[];
  mixRate?: number;
}): Uint8Array {
  const mixRate = input.mixRate ?? HELGA_MIX_RATE;
  const mic = resampleLinear(input.mic, input.micSampleRate, mixRate);
  const segments: PcmSegment[] = input.agent.map((slice) => ({
    startSample: Math.max(0, Math.round((slice.atMs / 1000) * mixRate)),
    samples: resampleLinear(pcm16ToFloat32(slice.pcm), slice.sampleRate, mixRate),
  }));
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
  let agentRate = HELGA_MIX_RATE;
  let agentRateKnown = false;
  let micRate = HELGA_MIX_RATE;
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let silent: MediaStreamAudioDestinationNode | null = null;
  const micChunks: Float32Array[] = [];
  const agent: AgentPcmSlice[] = [];
  let lastBlob: Blob | null = null;

  const applyAgentRate = (rate: number) => {
    if (rate < 8000 || rate > 48000) return;
    if (!agentRateKnown) {
      for (const slice of agent) {
        if (slice.sampleRate === agentRate) slice.sampleRate = rate;
      }
    }
    agentRate = rate;
    agentRateKnown = true;
  };

  const pullDownstream = () => {
    if (agentRateKnown || !options?.webchat) return;
    const rate = readDownstreamRate(options.webchat);
    if (rate) applyAgentRate(rate);
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
      pullDownstream();
      const Ctor = audioContextCtor();
      if (!Ctor || typeof mic.getAudioTracks !== "function") return;
      try {
        try {
          context = new Ctor({ latencyHint: "interactive" });
        } catch {
          context = new Ctor();
        }
        micRate = context.sampleRate || HELGA_MIX_RATE;
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
      pullDownstream();
      let used = 0;
      for (const slice of agent) used += slice.pcm.byteLength / 2;
      if (used >= agentRate * MAX_SECONDS) return;
      const copy = new Uint8Array(frame.byteLength);
      copy.set(frame);
      agent.push({ atMs: Math.max(0, Date.now() - startedAt), pcm: copy, sampleRate: agentRate });
    },
    setAgentSampleRate(rate: number) {
      applyAgentRate(rate);
    },
    async stop() {
      if (lastBlob) return lastBlob;
      running = false;
      stopped = true;
      pullDownstream();
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

/**
 * Listen for agent PCM on the SDK socket without replacing `onmessage`, so
 * playback keeps working. String frames are left to the SDK.
 */
export function attachHelgaAgentPcm(webchat: HelgaWebchatLike, sink: HelgaPcmSink): () => void {
  let socket: SocketLike | null = null;
  let listener: ((event: { data: unknown }) => void) | null = null;
  let jsonPinned = false;

  const publishRate = (message: unknown) => {
    const fromJson = readPcmSampleRate(message);
    if (fromJson) {
      jsonPinned = true;
      sink.setAgentSampleRate(fromJson);
      return;
    }
    if (jsonPinned) return;
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
