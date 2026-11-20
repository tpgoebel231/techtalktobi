import { ArrowUpRight } from "lucide-react";
import { NEW_TAB, NewTabHint } from "@/components/new-tab-hint";
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
  cvHref,
  type Video,
} from "@/data/media";
import { ChannelStatsGrid } from "@/components/channel-stats-grid";
import { latestChannelVideos, type FeedVideo } from "@/data/youtube-latest";
import { useCopy, useLocale } from "@/lib/i18n";

function feedAsVideo(item: FeedVideo, channel: Video["channel"]): Video {
  return { id: item.id, title: { en: item.title, de: item.title }, channel };
}

function notIn(list: Video[], seen: Set<string>) {
  return list.filter((video) => !seen.has(video.id));
}

export function MediaPage() {
  const locale = useLocale();
  const copy = useCopy();

  const teslaLatest = latestChannelVideos("teslatobi", 9);
  const talkLatest = latestChannelVideos("techtalktobi", 9);
  const teslaSeen = new Set(teslaLatest.map((item) => item.id));
  const talkSeen = new Set(talkLatest.map((item) => item.id));
  const teslaRobotics = notIn(videosByTopic(teslaTobiVideos[locale], "robotics"), teslaSeen);
  const teslaSociety = notIn(videosByTopic(teslaTobiVideos[locale], "ai-society"), teslaSeen);
  const teslaDriving = notIn(videosByTopic(teslaTobiVideos[locale], "self-driving"), teslaSeen);
  const talkSociety = notIn(videosByTopic(techTalkVideos, "ai-society"), talkSeen);
  const talkDriving = notIn(videosByTopic(techTalkVideos, "self-driving"), talkSeen);
  const talkRobotics = notIn(videosByTopic(techTalkVideos, "robotics"), talkSeen);

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
            <a href={cvHref(locale)} download>
              {copy.media.cvCta}
            </a>
          </Button>
        </div>
        <div className="mt-8">
          <ChannelStatsGrid heading="h3" />
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
          {copy.media.latest}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teslaLatest.map((item) => (
            <YoutubeCard key={item.id} video={feedAsVideo(item, "teslatobi")} />
          ))}
        </div>
        {teslaRobotics.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicRobotics}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teslaRobotics.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
        {teslaSociety.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicSociety}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teslaSociety.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
        {teslaDriving.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicDriving}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teslaDriving.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
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
          {copy.media.latest}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talkLatest.map((item) => (
            <YoutubeCard key={item.id} video={feedAsVideo(item, "techtalktobi")} />
          ))}
        </div>
        {talkRobotics.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicRobotics}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talkRobotics.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
        {talkSociety.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicSociety}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talkSociety.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
        {talkDriving.length > 0 ? (
          <>
            <h3 className="mt-12 font-mono text-[11px] tracking-widest text-muted uppercase">
              {copy.media.topicDriving}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talkDriving.map((video) => (
                <YoutubeCard key={video.id} video={video} />
              ))}
            </div>
          </>
        ) : null}
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
        <a href={url} {...NEW_TAB}>
          {copy.media.subscribe}
          <ArrowUpRight className="size-4" aria-hidden="true" />
          <NewTabHint />
        </a>
      </Button>
    </div>
  );
}
