import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attachHelgaAgentPcm,
  chooseAgentPlaybackRate,
  createHelgaLocalRecorder,
  encodeWav,
  estimateAgentSampleRate,
  mixCallToWav,
  placeAgentSegments,
  pcm16ToFloat32,
  resampleLinear,
} from "./helga-local-recorder.ts";
import { readPcmSampleRate } from "./helga-recording-join.ts";

function pcm16(samples: number[]): Uint8Array {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) view.setInt16(i * 2, samples[i], true);
  return bytes;
}

function sinePcm(sampleCount: number, sampleRate: number, freqHz: number): Uint8Array {
  const bytes = new Uint8Array(sampleCount * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < sampleCount; i += 1) {
    const value = Math.round(Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * 12000);
    view.setInt16(i * 2, value, true);
  }
  return bytes;
}

function crossingsAround(samples: Float32Array, center: number): number {
  let count = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1] - center;
    const next = samples[i] - center;
    if ((previous < 0 && next >= 0) || (previous >= 0 && next < 0)) count += 1;
  }
  return count;
}

function agentSineSlices(input: {
  packetSamples: number;
  sampleRate: number;
  packetCount: number;
  firstAtMs: number;
  wallGapMs: number;
  freqHz: number;
}): { atMs: number; pcm: Uint8Array; sampleRate: number }[] {
  const slices = [];
  for (let packet = 0; packet < input.packetCount; packet += 1) {
    const pcm = new Uint8Array(input.packetSamples * 2);
    const view = new DataView(pcm.buffer);
    const origin = packet * input.packetSamples;
    for (let i = 0; i < input.packetSamples; i += 1) {
      const n = origin + i;
      const value = Math.round(
        Math.sin((2 * Math.PI * input.freqHz * n) / input.sampleRate) * 12000,
      );
      view.setInt16(i * 2, value, true);
    }
    slices.push({
      atMs: input.firstAtMs + packet * input.wallGapMs,
      pcm,
      sampleRate: input.sampleRate,
    });
  }
  return slices;
}

/** 10 ms windows. A chopped 20 ms frame on a 60 ms clock leaves ~40 ms holes. */
function speechCoverage(
  samples: Float32Array,
  sampleRate: number,
): {
  duty: number;
  maxSilentGapSamples: number;
  runs: { start: number; end: number }[];
} {
  const windowSize = Math.max(1, Math.round(sampleRate * 0.01));
  const runs: { start: number; end: number }[] = [];
  let runStart = -1;
  let windows = 0;
  let audibleWindows = 0;
  let silentRun = 0;
  let maxSilentGapSamples = 0;
  const last = samples.length - (samples.length % windowSize);
  for (let start = 0; start < last; start += windowSize) {
    let energy = 0;
    for (let i = 0; i < windowSize; i += 1) energy += Math.abs(samples[start + i]);
    const audible = energy / windowSize >= 0.02;
    windows += 1;
    if (audible) {
      audibleWindows += 1;
      silentRun = 0;
      if (runStart < 0) runStart = start;
    } else {
      silentRun += windowSize;
      if (silentRun > maxSilentGapSamples) maxSilentGapSamples = silentRun;
      if (runStart >= 0) {
        runs.push({ start: runStart, end: start });
        runStart = -1;
      }
    }
  }
  if (runStart >= 0) runs.push({ start: runStart, end: last });
  return {
    duty: windows === 0 ? 0 : audibleWindows / windows,
    maxSilentGapSamples,
    runs,
  };
}

function decodeWav(wav: Uint8Array): { sampleRate: number; samples: Float32Array } {
  assert.equal(Buffer.from(wav.subarray(0, 4)).toString("ascii"), "RIFF");
  assert.equal(Buffer.from(wav.subarray(8, 12)).toString("ascii"), "WAVE");
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const sampleRate = view.getUint32(24, true);
  const dataSize = view.getUint32(40, true);
  const samples = new Float32Array(dataSize / 2);
  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = view.getInt16(44 + i * 2, true) / 32768;
  }
  return { sampleRate, samples };
}

describe("helga local mix", () => {
  it("rejects a 16 kHz pin that is about 3× off the device or burst clock", () => {
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 16000,
        context: 48000,
        estimated: 48000,
        json: 16000,
      }),
      { rate: 48000, source: "context" },
    );
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 16000,
        context: null,
        estimated: 48000,
        json: 16000,
      }),
      { rate: 48000, source: "estimate" },
    );
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 16000,
        context: 44100,
        estimated: null,
        json: 16000,
      }),
      { rate: 44100, source: "context" },
    );
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: null,
        context: null,
        estimated: 24000,
        json: 16000,
      }),
      { rate: 24000, source: "estimate" },
    );
  });

  it("keeps an honest 16 kHz pin and a real 24 kHz playPcm rate", () => {
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 16000,
        context: 48000,
        estimated: 16000,
        json: 16000,
      }),
      { rate: 16000, source: "downstream" },
    );
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 24000,
        context: 48000,
        estimated: null,
        json: null,
      }),
      { rate: 24000, source: "downstream" },
    );
    assert.deepEqual(
      chooseAgentPlaybackRate({
        downstream: 24000,
        context: 44100,
        estimated: null,
        json: null,
      }),
      { rate: 24000, source: "downstream" },
    );
    assert.equal(
      chooseAgentPlaybackRate({
        downstream: null,
        context: null,
        estimated: null,
        json: null,
      }),
      null,
    );
  });

  it("encodes mono 16-bit wav and mixes mic with agent pcm", () => {
    const mic = new Float32Array(8).fill(0.25);
    const agent = pcm16(new Array(8).fill(8192));
    assert.ok(Math.abs(pcm16ToFloat32(agent)[0] - 0.25) < 0.001);
    const wav = mixCallToWav({
      mic,
      micSampleRate: 16000,
      agent: [{ atMs: 0, pcm: agent, sampleRate: 16000 }],
    });
    const decoded = decodeWav(wav);
    assert.equal(decoded.sampleRate, 16000);
    assert.ok(decoded.samples[0] > 0.45 && decoded.samples[0] <= 1);
    const hot = mixCallToWav({
      mic: new Float32Array([0.8]),
      micSampleRate: 16000,
      agent: [{ atMs: 0, pcm: pcm16([26214]), sampleRate: 16000 }],
    });
    assert.ok(Math.abs(decodeWav(hot).samples[0] - 1) < 0.02);
    assert.equal(encodeWav(new Float32Array(0), 16000).byteLength, 44);
  });

  it("resamples and places a later agent frame on the timeline", () => {
    const down = resampleLinear(new Float32Array([0, 1, 0, 1]), 4, 2);
    assert.equal(down.length, 2);
    const wav = mixCallToWav({
      mic: new Float32Array(160),
      micSampleRate: 16000,
      agent: [{ atMs: 1000, pcm: pcm16([16000]), sampleRate: 16000 }],
    });
    const decoded = decodeWav(wav);
    assert.equal(decoded.samples[0], 0);
    assert.ok(Math.abs(decoded.samples[16000]) > 0.4);
  });

  it("packs 3× wall-clock gaps into one contiguous second", () => {
    // 20 ms of 48 kHz audio (960 samples) arriving every 60 ms. Labeled at the
    // true rate, receive-time placement is 20 ms of tone and 40 ms of silence.
    // That is the chopped voice after the rate fix. playPcm queues the frames.
    const packetSamples = 960;
    const packets = 50;
    const slices = agentSineSlices({
      packetSamples,
      sampleRate: 48_000,
      packetCount: packets,
      firstAtMs: 0,
      wallGapMs: 60,
      freqHz: 480,
    });
    const segments = placeAgentSegments(slices, 16_000);
    assert.equal(segments.length, packets);
    assert.equal(segments[0].startSample, 0);
    for (let i = 1; i < segments.length; i += 1) {
      assert.equal(
        segments[i].startSample,
        segments[i - 1].startSample + segments[i - 1].samples.length,
      );
    }

    const wav = mixCallToWav({
      mic: new Float32Array(0),
      micSampleRate: 16_000,
      agent: slices,
    });
    const decoded = decodeWav(wav);
    assert.equal(decoded.sampleRate, 16_000);
    // 50 × 20 ms at 48 kHz is one second at 16 kHz. Wall-clock placement runs
    // to the last arrival (2.94 s) plus the frame, about three seconds.
    assert.equal(decoded.samples.length, 16_000);
    const coverage = speechCoverage(decoded.samples, 16_000);
    assert.ok(coverage.duty > 0.95, `duty ${coverage.duty}`);
    assert.ok(
      coverage.maxSilentGapSamples < 320,
      `silent gap ${coverage.maxSilentGapSamples} samples`,
    );
    const tone = crossingsAround(decoded.samples, 0);
    assert.ok(tone > 900 && tone < 1020, `expected a 480 Hz tone, counted ${tone}`);
  });

  it("keeps a multi-hundred-ms wall gap as silence between turns", () => {
    const burst = (firstAtMs: number) =>
      agentSineSlices({
        packetSamples: 960,
        sampleRate: 48_000,
        packetCount: 10,
        firstAtMs,
        wallGapMs: 60,
        freqHz: 480,
      });
    // 10 frames, last arrival at 540 ms, then 400 ms of wall clock before the
    // next turn. Inside each turn the 60 ms receive spacing is still packed.
    const slices = [...burst(0), ...burst(540 + 400)];
    const segments = placeAgentSegments(slices, 16_000);
    assert.equal(segments[10].startSample, Math.round(0.94 * 16_000));
    assert.equal(
      segments[9].startSample + segments[9].samples.length,
      segments[0].startSample + 10 * segments[0].samples.length,
    );

    const wav = mixCallToWav({
      mic: new Float32Array(0),
      micSampleRate: 16_000,
      agent: slices,
    });
    const decoded = decodeWav(wav);
    const coverage = speechCoverage(decoded.samples, 16_000);
    assert.equal(coverage.runs.length, 2);
    assert.equal(coverage.runs[0].start, 0);
    const pauseSamples = coverage.runs[1].start - coverage.runs[0].end;
    assert.ok(pauseSamples >= 16_000 * 0.3, `pause ${pauseSamples} samples`);
    assert.ok(Math.abs(coverage.runs[1].start - Math.round(0.94 * 16_000)) <= 160);
  });

  it("mixes 48 kHz and 24 kHz agent PCM down to one second at 16 kHz", () => {
    const second48 = mixCallToWav({
      mic: new Float32Array(0),
      micSampleRate: 16000,
      agent: [{ atMs: 0, pcm: pcm16(new Array(48_000).fill(1000)), sampleRate: 48000 }],
    });
    const decoded48 = decodeWav(second48);
    assert.equal(decoded48.sampleRate, 16000);
    assert.equal(decoded48.samples.length, 16_000);

    const second24 = mixCallToWav({
      mic: new Float32Array(0),
      micSampleRate: 16000,
      agent: [{ atMs: 0, pcm: pcm16(new Array(24_000).fill(1000)), sampleRate: 24000 }],
    });
    const decoded24 = decodeWav(second24);
    assert.equal(decoded24.sampleRate, 16000);
    assert.equal(decoded24.samples.length, 16_000);

    // The same 48 kHz bytes left labeled 16 kHz occupy three seconds.
    const stretched = mixCallToWav({
      mic: new Float32Array(0),
      micSampleRate: 16000,
      agent: [{ atMs: 0, pcm: pcm16(new Array(48_000).fill(1000)), sampleRate: 16000 }],
    });
    assert.equal(decodeWav(stretched).samples.length, 48_000);
  });

  it("resamples device-rate capture down to a 16 kHz wav", () => {
    const wav = mixCallToWav({
      mic: new Float32Array(480).fill(0.25),
      micSampleRate: 48000,
      agent: [{ atMs: 0, pcm: pcm16(new Array(480).fill(8192)), sampleRate: 48000 }],
    });
    const decoded = decodeWav(wav);
    assert.equal(decoded.sampleRate, 16000);
    assert.equal(decoded.samples.length, 160);
    assert.ok(decoded.samples[0] > 0.45 && decoded.samples[0] <= 1);
  });

  it("taps binary websocket frames and advertised sample rates", () => {
    const frames: Uint8Array[] = [];
    let rate = 0;
    const listeners = new Set<(event: { data: unknown }) => void>();
    const socket = {
      addEventListener(_type: string, listener: (event: { data: unknown }) => void) {
        listeners.add(listener);
      },
      removeEventListener(_type: string, listener: (event: { data: unknown }) => void) {
        listeners.delete(listener);
      },
    };
    const handlers = new Map<string, Set<(data: unknown) => void>>();
    const webchat = {
      websocket: socket,
      downstreamSampleRate: null as number | null,
      on(event: string, handler: (data: unknown) => void) {
        let set = handlers.get(event);
        if (!set) {
          set = new Set();
          handlers.set(event, set);
        }
        set.add(handler);
        return () => set?.delete(handler);
      },
    };
    const stop = attachHelgaAgentPcm(webchat, {
      pushAgentPcm(frame) {
        frames.push(frame);
      },
      setAgentSampleRate(next) {
        rate = next;
      },
    });
    const pcm = pcm16([1, 2, 3]);
    for (const listener of listeners) listener({ data: pcm.buffer });
    for (const listener of listeners) listener({ data: '{"event":"text"}' });
    assert.equal(frames.length, 1);
    assert.equal(frames[0].byteLength, pcm.byteLength);
    for (const handler of handlers.get("message") ?? []) {
      handler({ playbackSampleRate: 24000 });
    }
    assert.equal(rate, 24000);
    assert.equal(readPcmSampleRate({ payload: { sample_rate: 16000 } }), 16000);
    stop();
    for (const listener of listeners) listener({ data: pcm.buffer });
    assert.equal(frames.length, 1);
  });

  it("reads downstreamSampleRate on attach and open, and a JSON rate does not freeze it", () => {
    const listeners = new Set<(event: { data: unknown }) => void>();
    const socket = {
      addEventListener(_type: string, listener: (event: { data: unknown }) => void) {
        listeners.add(listener);
      },
      removeEventListener(_type: string, listener: (event: { data: unknown }) => void) {
        listeners.delete(listener);
      },
    };
    const handlers = new Map<string, Set<(data: unknown) => void>>();
    const webchat = {
      websocket: socket,
      downstreamSampleRate: null as number | null,
      on(event: string, handler: (data: unknown) => void) {
        let set = handlers.get(event);
        if (!set) {
          set = new Set();
          handlers.set(event, set);
        }
        set.add(handler);
        return () => set?.delete(handler);
      },
    };
    let rate = 0;
    attachHelgaAgentPcm(webchat, {
      pushAgentPcm() {},
      setAgentSampleRate(next) {
        rate = next;
      },
    });
    assert.equal(rate, 0);
    webchat.downstreamSampleRate = 44100;
    for (const handler of handlers.get("open") ?? []) handler(undefined);
    assert.equal(rate, 44100);
    for (const handler of handlers.get("message") ?? []) handler({ event: "text" });
    assert.equal(rate, 44100);
    for (const handler of handlers.get("message") ?? []) {
      handler({ playbackSampleRate: 24000 });
    }
    assert.equal(rate, 24000);
    webchat.downstreamSampleRate = 48000;
    for (const listener of listeners) listener({ data: pcm16([1, 2]).buffer });
    for (const handler of handlers.get("open") ?? []) handler(undefined);
    assert.equal(rate, 48000);
  });

  it("labels agent pcm from downstreamSampleRate and still exports 16 kHz", async () => {
    const webchat = { downstreamSampleRate: null as number | null };
    const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
    await recorder.start();
    recorder.pushAgentPcm(pcm16(new Array(480).fill(8000)));
    webchat.downstreamSampleRate = 48000;
    const blob = await recorder.stop();
    const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
    assert.equal(decoded.sampleRate, 16000);
    assert.equal(decoded.samples.length, 160);
  });

  it("backfills 16 kHz placeholder slices when 48 kHz arrives late", async () => {
    const realNow = Date.now;
    const now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const webchat = { downstreamSampleRate: null as number | null };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.pushAgentPcm(pcm16(new Array(48_000).fill(8000)));
      webchat.downstreamSampleRate = 48000;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 16_000);
    } finally {
      Date.now = realNow;
    }
  });

  it("labels unlabeled frames from the AudioContext rate playPcm used", async () => {
    const realNow = Date.now;
    const now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: null, audioContext: null };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      webchat.audioContext = { sampleRate: 48000 };
      recorder.pushAgentPcm(pcm16(new Array(4800).fill(8000)));
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 1600);
    } finally {
      Date.now = realNow;
    }
  });

  it("estimates unlabeled 48 kHz frames from samples versus wall clock", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const webchat = { downstreamSampleRate: null as number | null };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      for (let i = 0; i < 50; i += 1) {
        recorder.pushAgentPcm(pcm16(new Array(960).fill(4000)));
        now += 20;
      }
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 16_000);
    } finally {
      Date.now = realNow;
    }
  });

  it("estimates a single unlabeled burst from call duration", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const recorder = createHelgaLocalRecorder({} as MediaStream, {
        webchat: { downstreamSampleRate: null },
      });
      await recorder.start();
      recorder.pushAgentPcm(pcm16(new Array(24_000).fill(4000)));
      now += 1000;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 16_000);
      assert.equal(
        estimateAgentSampleRate([{ atMs: 0, pcm: pcm16(new Array(48_000).fill(1)) }], 1000),
        48000,
      );
      assert.equal(
        estimateAgentSampleRate([{ atMs: 0, pcm: pcm16(new Array(16_000).fill(1)) }], 1000),
        16000,
      );
      assert.equal(estimateAgentSampleRate([{ atMs: 0, pcm: pcm16([1, 2]) }], 10), null);
    } finally {
      Date.now = realNow;
    }
  });

  it("estimates from in-burst gaps and does not snap a gappy 48 kHz stream to 16 kHz", () => {
    const continuous: { atMs: number; pcm: Uint8Array }[] = [];
    for (let i = 0; i < 50; i += 1) {
      continuous.push({ atMs: i * 20, pcm: pcm16(new Array(882).fill(1)) });
    }
    // 44.1 kHz packets over 1 s of a call that lasts 8 s. The pause after the
    // burst is not part of the clock.
    assert.equal(estimateAgentSampleRate(continuous, 8_000), 44100);

    const gappy: { atMs: number; pcm: Uint8Array }[] = [];
    let atMs = 0;
    for (let burst = 0; burst < 2; burst += 1) {
      for (let i = 0; i < 30; i += 1) {
        gappy.push({ atMs, pcm: pcm16(new Array(960).fill(1)) });
        atMs += 20;
      }
      atMs += 2_000;
    }
    // Wall clock across the pause is ~3.2 s for 57_600 samples (~18 kHz) and
    // would snap to 16 kHz. In-burst gaps stay at 48 kHz.
    assert.equal(estimateAgentSampleRate(gappy, atMs), 48000);
    assert.equal(estimateAgentSampleRate([], 1_000), null);
  });

  it("prefers a late downstreamSampleRate over the AudioContext fallback", async () => {
    const realNow = Date.now;
    const now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: null, audioContext: { sampleRate: 44100 } };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.pushAgentPcm(pcm16(new Array(24_000).fill(4000)));
      webchat.downstreamSampleRate = 24000;
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 16_000);
    } finally {
      Date.now = realNow;
    }
  });

  it("relabels every slice when a 16 kHz JSON pin disagrees with the AudioContext", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    const debug = console.debug;
    const logs: unknown[][] = [];
    console.debug = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: null, audioContext: null };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      recorder.pushAgentPcm(pcm16(new Array(48_000).fill(1000)));
      now += 1250;
      webchat.audioContext = { sampleRate: 48000 };
      recorder.pushAgentPcm(pcm16(new Array(48_000).fill(1000)));
      // `webchat.stop()` tears the context down before the mix.
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      // Both slices at 48 kHz: 1s + a slice placed at 1.25s → 36_000 samples.
      // Leaving the first slice at 16 kHz would run to 48_000.
      assert.equal(decoded.samples.length, 36_000);
      assert.ok(
        logs.some(
          (entry) =>
            entry[0] === "[helga] agentRate" && entry[1] === 48000 && entry[2] === "context",
        ),
      );
    } finally {
      Date.now = realNow;
      console.debug = debug;
    }
  });

  it("labels a gappy 48 kHz stream at 48 kHz even after a 16 kHz JSON pin", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    try {
      const recorder = createHelgaLocalRecorder({} as MediaStream, {
        webchat: { downstreamSampleRate: null },
      });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      for (let burst = 0; burst < 2; burst += 1) {
        for (let i = 0; i < 30; i += 1) {
          recorder.pushAgentPcm(pcm16(new Array(960).fill(1000)));
          now += 20;
        }
        now += 2_000;
      }
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      // Last packet is 960 samples at 3.18 s. At 48 kHz that packet is 20 ms,
      // so the mix ends at 51_200 samples. A stuck 16 kHz label makes the same
      // packet 60 ms and the mix ends at 51_840 — the slow voice.
      assert.equal(decoded.samples.length, 51_200);
    } finally {
      Date.now = realNow;
    }
  });

  it("does not let a lying 16 kHz downstream pin beat a 48 kHz burst clock", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    const debug = console.debug;
    const logs: unknown[][] = [];
    console.debug = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const webchat = { downstreamSampleRate: 16000 as number | null };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      recorder.pushAgentPcm(pcm16(new Array(48_000).fill(4000)));
      now += 1000;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      // 48_000 samples across one second are device-rate PCM. Keeping the
      // 16 kHz pin writes three seconds and is the slow voice.
      assert.equal(decoded.samples.length, 16_000);
      assert.ok(
        logs.some(
          (entry) =>
            entry[0] === "[helga] agentRate" && entry[1] === 48000 && entry[2] === "estimate",
        ),
      );
    } finally {
      Date.now = realNow;
      console.debug = debug;
    }
  });

  it("does not let a 16 kHz downstream or JSON pin freeze device-rate frames", async () => {
    const realNow = Date.now;
    const now = 1_700_000_000_000;
    Date.now = () => now;
    const debug = console.debug;
    const logs: unknown[][] = [];
    console.debug = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: 16000, audioContext: { sampleRate: 48000 } };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      recorder.pushAgentPcm(pcm16(new Array(48_000).fill(1000)));
      // `webchat.stop()` tears the context down before the mix.
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 16_000);
      assert.ok(
        logs.some(
          (entry) =>
            entry[0] === "[helga] agentRate" && entry[1] === 48000 && entry[2] === "context",
        ),
      );
    } finally {
      Date.now = realNow;
      console.debug = debug;
    }
  });

  it("keeps honest 16 kHz agent pcm when the device clock is 48 kHz", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    const debug = console.debug;
    const logs: unknown[][] = [];
    console.debug = (...args: unknown[]) => {
      logs.push(args);
    };
    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: 16000, audioContext: { sampleRate: 48000 } };
      const recorder = createHelgaLocalRecorder({} as MediaStream, { webchat });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      recorder.pushAgentPcm(pcm16(new Array(16_000).fill(4000)));
      now += 1000;
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      // Labeling these bytes at the 48 kHz device clock would shrink one
      // second of telephony audio to about a third of a second.
      assert.equal(decoded.samples.length, 16_000);
      assert.ok(
        logs.some(
          (entry) =>
            entry[0] === "[helga] agentRate" && entry[1] === 16000 && entry[2] === "downstream",
        ),
      );
    } finally {
      Date.now = realNow;
      console.debug = debug;
    }
  });

  it("mixes 48 kHz agent and 48 kHz mic to one intelligible second at 16 kHz", async () => {
    const realNow = Date.now;
    let now = 1_700_000_000_000;
    Date.now = () => now;
    const debug = console.debug;
    const logs: unknown[][] = [];
    console.debug = (...args: unknown[]) => {
      logs.push(args);
    };

    const worklets: Array<{ port: { onmessage: ((event: { data: unknown }) => void) | null } }> =
      [];
    class FakeNode {
      label: string;
      constructor(label: string) {
        this.label = label;
      }
      connect() {}
      disconnect() {}
    }
    class FakeWorklet extends FakeNode {
      port: { onmessage: ((event: { data: unknown }) => void) | null } = { onmessage: null };
      constructor() {
        super("worklet");
        worklets.push(this);
      }
    }
    class FakeContext {
      sampleRate = 48000;
      destination = { label: "destination" };
      audioWorklet = { async addModule() {} };
      constructor(options?: AudioContextOptions) {
        if (options?.sampleRate) this.sampleRate = options.sampleRate;
      }
      createMediaStreamSource() {
        return new FakeNode("source");
      }
      createMediaStreamDestination() {
        return new FakeNode("media-stream-destination");
      }
      async resume() {}
      async close() {}
    }
    const prior = globalThis as {
      AudioContext?: unknown;
      AudioWorkletNode?: unknown;
      webkitAudioContext?: unknown;
    };
    const previous = {
      AudioContext: prior.AudioContext,
      AudioWorkletNode: prior.AudioWorkletNode,
      webkitAudioContext: prior.webkitAudioContext,
    };
    prior.AudioContext = FakeContext;
    prior.AudioWorkletNode = FakeWorklet;
    prior.webkitAudioContext = undefined;

    try {
      const webchat: {
        downstreamSampleRate: number | null;
        audioContext: { sampleRate: number } | null;
      } = { downstreamSampleRate: 16000, audioContext: { sampleRate: 48000 } };
      const mic = { getAudioTracks: () => [] } as unknown as MediaStream;
      const recorder = createHelgaLocalRecorder(mic, { webchat });
      await recorder.start();
      recorder.setAgentSampleRate(16000);
      assert.equal(worklets.length, 1);
      const micFrame = new Float32Array(48_000).fill(0.25);
      worklets[0].port.onmessage?.({ data: micFrame.buffer });
      recorder.pushAgentPcm(sinePcm(48_000, 48_000, 480));
      now += 1000;
      webchat.audioContext = null;
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.equal(decoded.sampleRate, 16000);
      // Both clocks are 48 kHz, so one second of each side is 16_000 samples.
      // A 16 kHz agent label stretches Helga to 48_000 and drops a 480 Hz tone to 160 Hz.
      assert.equal(decoded.samples.length, 16_000);
      let sum = 0;
      for (const sample of decoded.samples) sum += sample;
      assert.ok(Math.abs(sum / decoded.samples.length - 0.25) < 0.05);
      const tone = crossingsAround(decoded.samples, 0.25);
      assert.ok(tone > 900 && tone < 1020, `expected a 480 Hz tone, counted ${tone}`);
      assert.ok(
        logs.some(
          (entry) =>
            entry[0] === "[helga] agentRate" && entry[1] === 48000 && entry[2] === "context",
        ),
      );

      // Bland's context is already gone and the burst is too short to estimate.
      // The recorder's own 48 kHz device clock still has to beat the 16 kHz pin.
      const pinned = createHelgaLocalRecorder(mic, {
        webchat: { downstreamSampleRate: 16000 },
      });
      await pinned.start();
      pinned.setAgentSampleRate(16000);
      pinned.pushAgentPcm(pcm16(new Array(48_000).fill(1000)));
      const pinnedWav = decodeWav(new Uint8Array(await (await pinned.stop()).arrayBuffer()));
      assert.equal(pinnedWav.sampleRate, 16000);
      assert.equal(pinnedWav.samples.length, 16_000);
    } finally {
      Date.now = realNow;
      console.debug = debug;
      prior.AudioContext = previous.AudioContext;
      prior.AudioWorkletNode = previous.AudioWorkletNode;
      prior.webkitAudioContext = previous.webkitAudioContext;
    }
  });

  it("taps the mic at the device rate without routing to the speakers", async () => {
    const constructed: Array<AudioContextOptions | undefined> = [];
    const connections: string[] = [];
    const worklets: Array<{ port: { onmessage: ((event: { data: unknown }) => void) | null } }> =
      [];

    class FakeNode {
      label: string;
      constructor(label: string) {
        this.label = label;
      }
      connect(target: { label?: string }) {
        connections.push(`${this.label}->${target.label ?? "unlabeled"}`);
      }
      disconnect() {}
    }

    class FakeWorklet extends FakeNode {
      port: { onmessage: ((event: { data: unknown }) => void) | null } = { onmessage: null };
      constructor() {
        super("worklet");
        worklets.push(this);
      }
    }

    class FakeContext {
      sampleRate = 48000;
      destination = { label: "destination" };
      audioWorklet = { async addModule() {} };
      constructor(options?: AudioContextOptions) {
        constructed.push(options);
        if (options?.sampleRate) this.sampleRate = options.sampleRate;
      }
      createMediaStreamSource() {
        return new FakeNode("source");
      }
      createMediaStreamDestination() {
        return new FakeNode("media-stream-destination");
      }
      createGain() {
        return new FakeNode("gain");
      }
      async resume() {}
      async close() {}
    }

    const prior = globalThis as {
      AudioContext?: unknown;
      AudioWorkletNode?: unknown;
      webkitAudioContext?: unknown;
    };
    const previous = {
      AudioContext: prior.AudioContext,
      AudioWorkletNode: prior.AudioWorkletNode,
      webkitAudioContext: prior.webkitAudioContext,
    };
    prior.AudioContext = FakeContext;
    prior.AudioWorkletNode = FakeWorklet;
    prior.webkitAudioContext = undefined;

    try {
      const mic = { getAudioTracks: () => [] } as unknown as MediaStream;
      const webchat = { downstreamSampleRate: 48000 };
      const recorder = createHelgaLocalRecorder(mic, { webchat });
      await recorder.start();
      assert.equal(worklets.length, 1);
      const micFrame = new Float32Array(4800).fill(0.2);
      worklets[0].port.onmessage?.({ data: micFrame.buffer });
      recorder.pushAgentPcm(pcm16(new Array(480).fill(8000)));
      const blob = await recorder.stop();
      const decoded = decodeWav(new Uint8Array(await blob.arrayBuffer()));
      assert.deepEqual(constructed, [{ latencyHint: "interactive" }]);
      assert.equal(
        constructed.some((options) => options?.sampleRate !== undefined),
        false,
      );
      assert.deepEqual(connections, ["source->worklet", "worklet->media-stream-destination"]);
      assert.equal(decoded.sampleRate, 16000);
      assert.equal(decoded.samples.length, 1600);
    } finally {
      prior.AudioContext = previous.AudioContext;
      prior.AudioWorkletNode = previous.AudioWorkletNode;
      prior.webkitAudioContext = previous.webkitAudioContext;
    }
  });
});
