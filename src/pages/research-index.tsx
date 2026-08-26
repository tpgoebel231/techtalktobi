import { Container } from "@/components/container";
import { ResearchCard } from "@/components/research-card";
import { research } from "@/data/research";
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
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {research.map((piece) => (
          <ResearchCard key={piece.slug} piece={piece} />
        ))}
      </div>
    </Container>
  );
}
