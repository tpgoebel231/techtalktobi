import { useState } from "react";
import { useWebchat } from "bland-client-js-sdk/react";
import { Button } from "@/components/ui/button";
import {
  fetchHelgaSession,
  HELGA_AGENT_ID,
  requestMicrophone,
  type MicPermission,
} from "@/lib/helga";
import { useCopy, useLocale } from "@/lib/i18n";

type CallError = Exclude<MicPermission, "ok"> | "failed" | null;

export function HelgaCall({ variant = "button" }: { variant?: "button" | "panel" }) {
  const copy = useCopy().helga;
  const locale = useLocale();
  const [open, setOpen] = useState(variant === "panel");
  const [error, setError] = useState<CallError>(null);
  const { state, start, stop } = useWebchat({
    agentId: HELGA_AGENT_ID,
    getToken: async () => {
      const session = await fetchHelgaSession(locale);
      return { token: session.token };
    },
  });

  const busy = state !== "closed";

  async function onStart() {
    setError(null);
    const mic = await requestMicrophone();
    if (mic !== "ok") {
      setError(mic);
      return;
    }
    try {
      await start();
    } catch {
      stop();
      setError("failed");
    }
  }

  function onClose() {
    stop();
    setError(null);
    if (variant === "button") setOpen(false);
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

  const panel = open ? (
    <div
      id="helga-call"
      className="w-full basis-full rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]"
    >
      {variant === "button" ? (
        <>
          <h3 className="font-display text-2xl text-fg">Helga</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{copy.dek}</p>
        </>
      ) : null}
      <p
        className={variant === "button" ? "mt-4 text-sm text-fg" : "text-sm text-fg"}
        aria-live="polite"
      >
        {errorText ?? status}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={() => void onStart()} disabled={busy}>
          {state === "connecting" ? copy.connecting : copy.start}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            stop();
            setError(null);
          }}
          disabled={state === "closed"}
        >
          {copy.stop}
        </Button>
        {variant === "button" ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            {copy.close}
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  if (variant === "panel") return panel;

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
      {panel}
    </>
  );
}
