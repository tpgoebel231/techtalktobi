import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { YoutubeCard } from "@/components/youtube-card";
import {
  channels,
  reports,
  techTalkVideos,
  teslaTobiVideos,
} from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function MediaPage() {
  const locale = useLocale();
  const copy = useCopy();

  return (
    <Container className="py-14 sm:py-20">
      <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
        {copy.media.eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
        {copy.media.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{copy.media.dek}</p>

      <section className="mt-16">
        <ChannelHead
          name={channels.teslatobi.name[locale]}
          handle={channels.teslatobi.handle}
          dek={copy.media.teslaTobiDek}
          url={channels.teslatobi.url}
          meta={channels.teslatobi.stats[locale]}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teslaTobiVideos.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      <section className="mt-20">
        <ChannelHead
          name={channels.techtalktobi.name[locale]}
          handle={channels.techtalktobi.handle}
          dek={copy.media.techTalkDek}
          url={channels.techtalktobi.url}
          meta={channels.techtalktobi.stats[locale]}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techTalkVideos.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      <section className="mt-20 border-t border-border pt-16">
        <h2 className="font-display text-3xl text-fg">{copy.media.reportsTitle}</h2>
        <p className="mt-2 max-w-xl text-muted">{copy.media.reportsDek}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {reports.map((report) => (
            <Link
              key={report.slug}
              to="/$locale/media/$slug"
              params={{ locale, slug: report.slug }}
              className="group overflow-hidden rounded-xl bg-surface no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <img
                src={report.image}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="p-5">
                <p className="font-mono text-[11px] text-faint">{report.date}</p>
                <h3 className="mt-2 font-display text-2xl text-fg">
                  {report.title[locale]}
                </h3>
                <p className="mt-2 text-sm text-muted">{report.dek[locale]}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
                  {copy.media.reportCta}
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}

function ChannelHead({
  name,
  handle,
  dek,
  url,
  meta,
}: {
  name: string;
  handle: string;
  dek: string;
  url: string;
  meta: string;
}) {
  const copy = useCopy();
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-3xl text-fg">{name}</h2>
          <Badge variant="outline">{handle}</Badge>
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted">{dek}</p>
        <p className="mt-1 font-mono text-[11px] text-faint">{meta}</p>
      </div>
      <Button asChild variant="outline">
        <a href={url} target="_blank" rel="noreferrer">
          {copy.media.subscribe}
        </a>
      </Button>
    </div>
  );
}
