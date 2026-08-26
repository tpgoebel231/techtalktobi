import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResearchPiece } from "@/data/research";
import { useCopy, useLocale } from "@/lib/i18n";

export function ResearchCard({ piece }: { piece: ResearchPiece }) {
  const locale = useLocale();
  const copy = useCopy();

  return (
    <Link
      to="/$locale/research/$slug"
      params={{ locale, slug: piece.slug }}
      className="group flex flex-col overflow-hidden rounded-xl bg-surface no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="aspect-3/2 overflow-hidden bg-surface-2">
        <img
          src={piece.image}
          alt=""
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <Badge>{copy.research.kinds[piece.kind]}</Badge>
          <span className="font-mono text-[11px] text-faint tabular-nums">
            {piece.date}
          </span>
        </div>
        <h3 className="font-display text-2xl leading-snug text-fg">
          {piece.title[locale]}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
          {piece.dek[locale]}
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-accent">
          {copy.research.read}
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
