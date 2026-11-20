import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/container";
import { ResearchCard } from "@/components/research-card";
import {
  RESEARCH_CATEGORIES,
  getResearchCategory,
  researchInCategory,
  type ResearchCategorySlug,
} from "@/data/research";
import { useCopy, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ResearchCategoryPage({ slug }: { slug: ResearchCategorySlug }) {
  const locale = useLocale();
  const copy = useCopy();
  const category = getResearchCategory(slug)!;
  const pieces = researchInCategory(slug);
  const count = `${pieces.length} ${pieces.length === 1 ? copy.research.pieceSingular : copy.research.piecePlural}`;

  return (
    <Container className="py-10 sm:py-16">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link
              to="/$locale/research"
              params={{ locale }}
              className="inline-flex h-11 items-center no-underline hover:text-fg"
            >
              {copy.research.title}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-4 text-faint" />
          </li>
          <li aria-current="page" className="text-fg">
            {category.label[locale]}
          </li>
        </ol>
      </nav>
      <p className="mt-6 font-mono text-[11px] tracking-widest text-accent uppercase tabular-nums">
        {count}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
        {category.label[locale]}
      </h1>
      <nav aria-label={copy.research.topicsLabel} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {RESEARCH_CATEGORIES.map((item) => {
            const active = item.slug === slug;
            return (
              <li key={item.slug}>
                <Link
                  to="/$locale/research/topics/$topic"
                  params={{ locale, topic: item.slug }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-4 text-sm no-underline shadow-[var(--shadow-border)] transition-colors",
                    active
                      ? "bg-fg text-bg"
                      : "bg-surface text-muted hover:text-fg",
                  )}
                >
                  {item.label[locale]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece) => (
          <ResearchCard key={piece.slug} piece={piece} />
        ))}
      </div>
    </Container>
  );
}
