import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { YoutubeCard } from "@/components/youtube-card";
import {
  channels,
  links,
  reportVideos,
  techTalkVideos,
  teslaTobiVideos,
  videosByTopic,
} from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function MediaPage() {
  const locale = useLocale();
  const copy = useCopy();

  const teslaRobotics = videosByTopic(teslaTobiVideos, "robotics");
  const teslaDriving = videosByTopic(teslaTobiVideos, "self-driving");
  const talkSociety = videosByTopic(techTalkVideos, "ai-society");
  const talkDriving = videosByTopic(techTalkVideos, "self-driving");
  const talkRobotics = videosByTopic(techTalkVideos, "robotics");

  return (
    <Container className="py-14 sm:py-20">
      <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
        {copy.media.eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
        {copy.media.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{copy.media.dek}</p>

      <section className="mt-10 rounded-xl bg-surface p-6 shadow-[var(--shadow-border)] sm:p-8">
        <h2 className="font-display text-2xl text-fg">{copy.media.pressTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{copy.media.pressDek}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <a href={links.mediaKit} download>
              {copy.about.mediaKitCta}
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/$locale/media-kit" params={{ locale }}>
              {copy.nav.mediaKit}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-fg">{copy.media.reportsTitle}</h2>
        <p className="mt-2 max-w-xl text-muted">{copy.media.reportsDek}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reportVideos.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      <section className="mt-20">
        <ChannelHead
          name={channels.teslatobi.name[locale]}
          handle={channels.teslatobi.handle}
          dek={copy.media.teslaTobiDek}
          url={channels.teslatobi.url}
          meta={channels.teslatobi.lang[locale]}
        />
        <h3 className="mt-10 font-mono text-[11px] tracking-widest text-muted uppercase">
          {copy.media.topicRobotics}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teslaRobotics.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
        <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
          {copy.media.topicDriving}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teslaDriving.map((video) => (
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
          meta={channels.techtalktobi.lang[locale]}
        />
        <h3 className="mt-10 font-mono text-[11px] tracking-widest text-muted uppercase">
          {copy.media.topicRobotics}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talkRobotics.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
        <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
          {copy.media.topicSociety}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talkSociety.map((video) => (
            <YoutubeCard key={video.id} video={video} />
          ))}
        </div>
        <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
          {copy.media.topicDriving}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talkDriving.map((video) => (
            <YoutubeCard key={video.id} video={video} />
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
          <ArrowUpRight className="size-4" />
        </a>
      </Button>
    </div>
  );
}
