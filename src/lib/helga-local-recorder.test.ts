import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attachHelgaAgentPcm,
  createHelgaLocalRecorder,
  encodeWav,
  mixCallToWav,
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

  it("reads downstreamSampleRate on attach and open, until JSON pins it", () => {
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
    assert.equal(rate, 24000);
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
