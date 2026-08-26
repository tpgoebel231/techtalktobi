import { Play } from "lucide-react";
import type { Video } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function YoutubeCard({ video }: { video: Video }) {
  const locale = useLocale();
  const copy = useCopy();
  const href = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl bg-surface no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        <img
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt=""
          className="size-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-bg/20">
          <span className="flex size-12 items-center justify-center rounded-full bg-fg text-bg">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm leading-snug text-fg">{video.title[locale]}</h3>
        <span className="text-xs text-accent">{copy.media.watch}</span>
      </div>
    </a>
  );
}
