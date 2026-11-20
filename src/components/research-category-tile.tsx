import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  getResearch,
  researchCardTitle,
  researchInCategory,
  type ResearchCategory,
} from "@/data/research";
import { useCopy, useLocale } from "@/lib/i18n";
import { CARD_SIZES, imageSrcSet } from "@/lib/images";

/** Large overview tile on the Research index: image, label, count, piece titles. */
export function ResearchCategoryTile({ category }: { category: ResearchCategory }) {
  const locale = useLocale();
  const copy = useCopy();
  const pieces = researchInCategory(category.slug);
  const image = getResearch(category.imageFrom)?.image ?? pieces[0]?.image;
  const count = `${pieces.length} ${pieces.length === 1 ? copy.research.pieceSingular : copy.research.piecePlural}`;

  return (
    <Link
      to="/$locale/research/topics/$topic"
      params={{ locale, topic: category.slug }}
      className="group flex flex-col overflow-hidden rounded-xl bg-surface no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="relative aspect-16/9 overflow-hidden bg-surface-2">
        {image ? (
          <img
            src={image}
            srcSet={imageSrcSet(image)}
            sizes={CARD_SIZES}
            width={1200}
            height={675}
            decoding="async"
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-3xl leading-tight text-fg">
            {category.label[locale]}
          </h2>
          <span className="shrink-0 font-mono text-[11px] tracking-widest text-faint uppercase tabular-nums">
            {count}
          </span>
        </div>
        <ul className="flex flex-1 flex-col divide-y divide-border text-sm leading-snug text-muted">
          {pieces.map((piece) => (
            <li key={piece.slug} className="py-2 first:pt-0">
              {researchCardTitle(piece, locale)}
            </li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1 text-sm text-accent">
          {copy.research.viewAll}
          <ArrowRight
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
