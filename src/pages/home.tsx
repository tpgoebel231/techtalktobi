import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/container";
import { ResearchCard } from "@/components/research-card";
import { Button } from "@/components/ui/button";
import { research } from "@/data/research";
import { links } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

const FEATURED = ["speed-vs-safety", "fsd-matrix", "waymo"] as const;

export function HomePage() {
  const locale = useLocale();
  const copy = useCopy();
  const featured = FEATURED.map(
    (slug) => research.find((item) => item.slug === slug)!,
  );

  return (
    <>
      <section className="border-b border-border">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <img
              src="/images/tobias.jpg"
              alt={copy.brand.name}
              className="aspect-square w-full max-w-sm rounded-xl object-cover lg:max-w-none"
            />
          </div>
          <div className="lg:col-span-8">
            <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
              {copy.home.eyebrow}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-fg sm:text-6xl lg:text-7xl">
              {copy.home.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-fg/90 sm:text-lg">
              {copy.home.dek}
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
              {copy.home.kicker}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/$locale/media" params={{ locale }}>
                  {copy.home.ctaMedia}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/$locale/consulting" params={{ locale }}>
                  {copy.home.ctaAdvisory}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/$locale/research" params={{ locale }}>
                  {copy.home.ctaResearch}
                </Link>
              </Button>
            </div>
            <p className="mt-6 font-mono text-xs text-faint">
              <a href={links.x} className="hover:text-fg">
                @{copy.brand.handle}
              </a>
              <span className="mx-2">·</span>
              <a href={`mailto:${links.email}`} className="hover:text-fg">
                {links.email}
              </a>
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <Door
              index="01"
              title={copy.home.mediaDoorTitle}
              dek={copy.home.mediaDoorDek}
              cta={copy.home.mediaDoorCta}
              to="/$locale/media"
              locale={locale}
            />
            <Door
              index="02"
              title={copy.home.advisoryDoorTitle}
              dek={copy.home.advisoryDoorDek}
              cta={copy.home.advisoryDoorCta}
              to="/$locale/consulting"
              locale={locale}
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-fg sm:text-4xl">
                {copy.home.featured}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {copy.home.featuredDek}
              </p>
            </div>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link to="/$locale/research" params={{ locale }}>
                {copy.nav.research}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featured.map((piece) => (
              <ResearchCard key={piece.slug} piece={piece} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

function Door({
  index,
  title,
  dek,
  cta,
  to,
  locale,
}: {
  index: string;
  title: string;
  dek: string;
  cta: string;
  to: "/$locale/media" | "/$locale/consulting";
  locale: "en" | "de";
}) {
  return (
    <Link
      to={to}
      params={{ locale }}
      className="group flex flex-col rounded-xl bg-surface p-7 no-underline shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] sm:p-8"
    >
      <p className="font-mono text-xs text-accent tabular-nums">{index}</p>
      <h2 className="mt-3 font-display text-3xl text-fg">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{dek}</p>
      <span className="mt-6 inline-flex items-center gap-1 text-sm text-accent">
        {cta}
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}
