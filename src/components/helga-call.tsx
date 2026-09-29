import { useEffect, useRef, useState } from "react";
import { useWebchat } from "bland-client-js-sdk/react";
import { Button } from "@/components/ui/button";
import {
  fetchHelgaSession,
  helgaAgentIdForLocale,
  newHelgaUploadId,
  openMicrophone,
  stopMicrophone,
  uploadHelgaRecording,
  type MicPermission,
} from "@/lib/helga";
import { attachHelgaAgentPcm, createHelgaLocalRecorder } from "@/lib/helga-local-recorder";
import { useCopy, useLocale } from "@/lib/i18n";

type CallError = Exclude<MicPermission, "ok"> | "failed" | null;

/** Client cap. The countdown starts only after the call is connected. */
const HELGA_MAX_CALL_MS = 120_000;

type CaptureSession = {
  uploadId: string;
  stream: MediaStream;
  recorder: ReturnType<typeof createHelgaLocalRecorder>;
  untap: () => void;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(Math.min(HELGA_MAX_CALL_MS, Math.max(0, ms)) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function HelgaCall() {
  const copy = useCopy().helga;
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<CallError>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const agentId = helgaAgentIdForLocale(locale);
  const uploadIdRef = useRef<string | null>(null);
  const captureRef = useRef<CaptureSession | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const { state, start, stop, webchat } = useWebchat({
    agentId,
    getToken: async () => {
      const session = await fetchHelgaSession(locale, uploadIdRef.current);
      return { token: session.token };
    },
  });
  const stopRef = useRef(stop);
  stopRef.current = stop;
  const stateRef = useRef(state);
  stateRef.current = state;
  const startingRef = useRef(false);
  // Drop or start the clock in the same render that leaves or enters "open",
  // so connecting and idle never paint a stale countdown.
  const [trackedState, setTrackedState] = useState(state);
  if (trackedState !== state) {
    setTrackedState(state);
    setRemainingMs(state === "open" ? HELGA_MAX_CALL_MS : null);
  }

  const endCaptureRef = useRef<() => Promise<void>>(async () => {});
  endCaptureRef.current = async () => {
    const session = captureRef.current;
    captureRef.current = null;
    if (!session) return;
    session.untap();
    let blob: Blob | null = null;
    try {
      blob = await session.recorder.stop();
    } catch {
      console.error("[helga] recorder stop failed");
    } finally {
      stopMicrophone(session.stream);
    }
    if (!blob || blob.size <= 44) return;
    try {
      await uploadHelgaRecording(blob, session.uploadId, localeRef.current);
    } catch {
      console.error("[helga] recording upload failed");
    }
  };

  // The hook sets React state to "closed" only inside stop(). A remote hangup
  // emits webchat "closed" / "error" and would otherwise leave the panel on the call.
  useEffect(() => {
    const endFromRemote = () => {
      const wasConnected = stateRef.current === "open";
      stopRef.current();
      void endCaptureRef.current();
      if (wasConnected) setError(null);
    };
    const offClosed = webchat.on("closed", endFromRemote);
    const offError = webchat.on("error", endFromRemote);
    return () => {
      offClosed();
      offError();
    };
  }, [webchat]);

  useEffect(() => {
    if (state !== "open") return;

    const deadline = Date.now() + HELGA_MAX_CALL_MS;
    const intervalId = window.setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      if (left <= 0) {
        window.clearInterval(intervalId);
        setRemainingMs(0);
        stopRef.current();
        void endCaptureRef.current();
        setError(null);
        return;
      }
      setRemainingMs(left);
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state]);

  const busy = state !== "closed";
  const countdown = state === "open" && remainingMs !== null ? formatRemaining(remainingMs) : null;

  function hangUp() {
    stopRef.current();
    void endCaptureRef.current();
  }

  async function onStart() {
    if (startingRef.current || stateRef.current !== "closed") return;
    startingRef.current = true;
    setError(null);
    const mic = await openMicrophone();
    if (mic.permission !== "ok") {
      startingRef.current = false;
      setError(mic.permission);
      return;
    }
    const uploadId = newHelgaUploadId();
    uploadIdRef.current = uploadId;
    try {
      await start();
    } catch {
      stopMicrophone(mic.stream);
      uploadIdRef.current = null;
      stop();
      setError("failed");
      startingRef.current = false;
      return;
    }
    try {
      const recorder = createHelgaLocalRecorder(mic.stream);
      const untap = attachHelgaAgentPcm(webchat, recorder);
      captureRef.current = { uploadId, stream: mic.stream, recorder, untap };
      await recorder.start();
      if (stateRef.current === "closed") void endCaptureRef.current();
    } catch {
      const session = captureRef.current;
      captureRef.current = null;
      session?.untap();
      stopMicrophone(session?.stream ?? mic.stream);
      console.error("[helga] recorder failed");
    } finally {
      startingRef.current = false;
    }
  }

  function onClose() {
    hangUp();
    setError(null);
    setOpen(false);
  }

  const status = state === "open" ? copy.live : state === "closed" ? copy.idle : copy.connecting;
  const errorText =
    error === "denied"
      ? copy.micDenied
      : error === "unavailable"
        ? copy.micUnavailable
        : error === "failed"
          ? copy.error
          : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-controls="helga-call"
        onClick={() => {
          if (open) onClose();
          else setOpen(true);
        }}
      >
        {copy.talk}
      </Button>
      {open ? (
        <div
          id="helga-call"
          className="w-full basis-full rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]"
        >
          <h3 className="font-display text-2xl text-fg">Helga</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{copy.dek}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{copy.recording}</p>
          <p className="mt-4 text-sm text-fg">
            <span aria-live="polite">{errorText ?? status}</span>
            {countdown ? (
              <span className="ml-3 tabular-nums" aria-live="polite">
                {countdown}
              </span>
            ) : null}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void onStart()} disabled={busy}>
              {state === "connecting" ? copy.connecting : copy.start}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                hangUp();
                setError(null);
              }}
              disabled={state === "closed"}
            >
              {copy.stop}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              {copy.close}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
