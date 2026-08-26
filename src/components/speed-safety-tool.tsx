import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useCopy, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Units = "kmh" | "mph";
type Surface = "dry" | "wet" | "snow" | "ice";

const MU: Record<Surface, number> = {
  dry: 0.75,
  wet: 0.45,
  snow: 0.25,
  ice: 0.1,
};

const G = 9.81;
const MASS = 1500;

function toMps(speed: number, units: Units) {
  return units === "kmh" ? speed / 3.6 : speed * 0.44704;
}

function toKmh(speed: number, units: Units) {
  return units === "kmh" ? speed : speed * 1.60934;
}

function formatLen(meters: number, units: Units) {
  if (units === "mph") {
    const ft = meters * 3.28084;
    return ft >= 100 ? `${Math.round(ft)} ft` : `${ft.toFixed(1)} ft`;
  }
  return meters >= 20 ? `${Math.round(meters)} m` : `${meters.toFixed(1)} m`;
}

function fatalRisk(kmh: number) {
  return 1 / (1 + Math.exp(6.9 - 0.09 * kmh));
}

function seriousRisk(kmh: number) {
  return 1 / (1 + Math.exp(4.26 - 0.077 * kmh));
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function riskTone(n: number): "ok" | "warn" | "danger" {
  if (n < 0.15) return "ok";
  if (n < 0.45) return "warn";
  return "danger";
}

export function SpeedSafetyTool() {
  const locale = useLocale();
  const copy = useCopy().tool;
  const [units, setUnits] = useState<Units>(locale === "de" ? "kmh" : "mph");
  const [speed, setSpeed] = useState(locale === "de" ? 50 : 30);
  const [reaction, setReaction] = useState(1.5);
  const [surface, setSurface] = useState<Surface>("dry");

  const math = useMemo(() => {
    const v = toMps(speed, units);
    const think = v * reaction;
    const brake = (v * v) / (2 * MU[surface] * G);
    const total = think + brake;
    const kmh = toKmh(speed, units);
    const energy = (0.5 * MASS * v * v) / 1000;
    const fatal = fatalRisk(kmh);
    const serious = seriousRisk(kmh);
    return { think, brake, total, energy, fatal, serious };
  }, [speed, units, reaction, surface]);

  const maxBar = Math.max(math.total, 80);
  const thinkPct = (math.think / maxBar) * 100;
  const brakePct = (math.brake / maxBar) * 100;

  const surfaces: Surface[] = ["dry", "wet", "snow", "ice"];

  return (
    <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-8">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <fieldset>
            <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              {copy.units}
            </legend>
            <div className="inline-flex rounded-full bg-surface-2 p-1">
              {(["kmh", "mph"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    if (u === units) return;
                    setSpeed((s) =>
                      u === "kmh" ? Math.round(s * 1.60934) : Math.round(s / 1.60934),
                    );
                    setUnits(u);
                  }}
                  className={cn(
                    "h-9 min-w-16 rounded-full px-3 font-mono text-xs",
                    units === u ? "bg-fg text-bg" : "text-muted hover:text-fg",
                  )}
                >
                  {copy[u]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span className="text-muted">{copy.speed}</span>
              <span className="font-mono text-fg tabular-nums">
                {speed} {copy[units]}
              </span>
            </span>
            <Slider
              min={units === "kmh" ? 10 : 5}
              max={units === "kmh" ? 130 : 80}
              step={1}
              value={[speed]}
              onValueChange={([v]) => setSpeed(v ?? speed)}
              className="mt-2"
            />
          </label>

          <label className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span className="text-muted">{copy.reaction}</span>
              <span className="font-mono text-fg tabular-nums">
                {reaction.toFixed(1)} s
              </span>
            </span>
            <Slider
              min={0.6}
              max={3}
              step={0.1}
              value={[reaction]}
              onValueChange={([v]) => setReaction(v ?? reaction)}
              className="mt-2"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm text-muted">{copy.surface}</legend>
            <div className="grid grid-cols-2 gap-2">
              {surfaces.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSurface(s)}
                  className={cn(
                    "h-11 rounded-lg text-sm transition-colors duration-150",
                    surface === s
                      ? "bg-fg text-bg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  {copy[s]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {copy.total}
            </p>
            <p className="font-display text-5xl leading-none text-fg tabular-nums">
              {formatLen(math.total, units)}
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-2">
              <div className="flex h-full">
                <div
                  className="h-full bg-accent/70"
                  style={{ width: `${thinkPct}%` }}
                />
                <div
                  className="h-full bg-accent"
                  style={{ width: `${brakePct}%` }}
                />
              </div>
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-faint">
              <span>
                {copy.think} {formatLen(math.think, units)}
              </span>
              <span>
                {copy.brake} {formatLen(math.brake, units)}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Stat label={copy.energy} value={`${Math.round(math.energy)} kJ`} />
            <Stat
              label={copy.fatal}
              value={pct(math.fatal)}
              tone={riskTone(math.fatal)}
            />
            <Stat
              label={copy.serious}
              value={pct(math.serious)}
              tone={riskTone(math.serious)}
            />
            <Stat
              label="μ"
              value={MU[surface].toFixed(2)}
            />
          </dl>

          <p className="text-xs leading-relaxed text-faint">{copy.model}</p>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-lg tabular-nums",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
          !tone && "text-fg",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
