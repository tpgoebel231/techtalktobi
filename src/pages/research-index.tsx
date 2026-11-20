import { Container } from "@/components/container";
import { ResearchCategoryTile } from "@/components/research-category-tile";
import { RESEARCH_CATEGORIES } from "@/data/research";
import { useCopy } from "@/lib/i18n";

export function ResearchIndexPage() {
  const copy = useCopy();

  return (
    <Container className="py-14 sm:py-20">
      <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
        {copy.research.eyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
        {copy.research.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{copy.research.dek}</p>
      <nav aria-label={copy.research.topicsLabel} className="mt-12">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {RESEARCH_CATEGORIES.map((category) => (
            <li key={category.slug} className="flex flex-col [&>a]:flex-1">
              <ResearchCategoryTile category={category} />
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
