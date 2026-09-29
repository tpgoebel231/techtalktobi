import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attachHelgaAgentPcm,
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
});
