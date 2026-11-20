import { channelStats } from "@/data/channel-stats";
import { channels } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

type Gender = { readonly male: number; readonly female: number; readonly userSpecified: number };
type AgeBand = { readonly band: string; readonly share: number };

function useFormatters() {
  const locale = useLocale();
  const tag = locale === "de" ? "de-DE" : "en-US";
  const number = new Intl.NumberFormat(tag);
  const percent = new Intl.NumberFormat(tag, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const hours = (value: number) =>
    new Intl.NumberFormat(tag, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);
  return { number, percent, hours };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-fg tabular-nums">{value}</dd>
    </div>
  );
}

function GenderLine({ gender, percent, copy }: { gender: Gender; percent: Intl.NumberFormat; copy: ReturnType<typeof useCopy>["mediaKit"] }) {
  return (
    <p className="text-sm text-fg">
      <span className="text-muted">{copy.gender}: </span>
      {percent.format(gender.male)} {copy.male}, {percent.format(gender.female)} {copy.female},{" "}
      {percent.format(gender.userSpecified)} {copy.userSpecified}
    </p>
  );
}

function AgeLine({ bands, percent, copy }: { bands: readonly AgeBand[]; percent: Intl.NumberFormat; copy: ReturnType<typeof useCopy>["mediaKit"] }) {
  return (
    <p className="text-sm text-fg">
      <span className="text-muted">{copy.age}: </span>
      {bands.map((band) => `${band.band} ${percent.format(band.share)}`).join(", ")}
    </p>
  );
}

export function ChannelStatsGrid({ heading = "h2" }: { heading?: "h2" | "h3" }) {
  const locale = useLocale();
  const copy = useCopy().mediaKit;
  const { number, percent, hours } = useFormatters();
  const tesla = channelStats.teslatobi;
  const talk = channelStats.techtalktobi;
  const Heading = heading;

  return (
    <div>
      <Heading className={heading === "h3" ? "font-display text-xl text-fg" : "font-display text-2xl text-fg"}>
        {copy.stats}
      </Heading>
      <p className="mt-2 text-sm text-muted">{copy.statsAsOf}</p>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium tracking-wide text-muted uppercase">
            {channels.teslatobi.name[locale]}
          </p>
          <dl className="mt-3 space-y-1.5">
            <Row label={copy.subscribers} value={number.format(tesla.subscribers)} />
            <Row label={copy.totalViews} value={number.format(tesla.totalViews)} />
            <Row label={copy.views90d} value={number.format(tesla.views90d)} />
            <Row label={copy.watch90d} value={`${hours(tesla.watchHours90d)} ${copy.hours}`} />
            <Row label={copy.medianViews} value={number.format(tesla.medianViews)} />
            <Row label={copy.meanViews} value={number.format(tesla.meanViews)} />
          </dl>
          <p className="mt-1 text-xs text-muted">{copy.teslaViewsBasis}</p>
          <dl className="mt-3 space-y-1.5">
            <Row label={copy.dachShare} value={percent.format(tesla.dachShare90d)} />
          </dl>
          <p className="mt-2 text-sm text-fg">
            <span className="text-muted">{copy.topCountries}: </span>
            {tesla.countries90d.map((row) => `${row.code} ${percent.format(row.share)}`).join(", ")}
          </p>
          <div className="mt-2 space-y-1">
            <GenderLine gender={tesla.gender90d} percent={percent} copy={copy} />
            <AgeLine bands={tesla.age90d} percent={percent} copy={copy} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium tracking-wide text-muted uppercase">
            {channels.techtalktobi.name[locale]}
          </p>
          <dl className="mt-3 space-y-1.5">
            <Row label={copy.subscribers} value={number.format(talk.subscribers)} />
            <Row label={copy.totalViews} value={number.format(talk.totalViews)} />
            <Row label={copy.views90d} value={number.format(talk.views90d)} />
            <Row label={copy.watch90d} value={`${hours(talk.watchHours90d)} ${copy.hours}`} />
            <Row label={copy.medianViews} value={number.format(talk.medianViews)} />
            <Row label={copy.meanViews} value={number.format(talk.meanViews)} />
          </dl>
          <p className="mt-1 text-xs text-muted">{copy.talkViewsBasis}</p>
          <div className="mt-3 space-y-1">
            <GenderLine gender={talk.gender90d} percent={percent} copy={copy} />
            <AgeLine bands={talk.age90d} percent={percent} copy={copy} />
          </div>
        </div>
      </div>
    </div>
  );
}
