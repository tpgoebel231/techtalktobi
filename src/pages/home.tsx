import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/container";
import { ResearchCard } from "@/components/research-card";
import { Button } from "@/components/ui/button";
import { research } from "@/data/research";
import { channels, links } from "@/data/media";
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
      <section className="relative isolate min-h-[78dvh] overflow-hidden">
        <img
          src="/images/hero-highway.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-bg/40" />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/80 to-transparent" />
        <Container className="relative flex min-h-[78dvh] flex-col justify-end py-16 sm:py-24">
          <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {copy.home.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] text-fg sm:text-6xl lg:text-7xl">
            {copy.home.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-fg/90 sm:text-lg">
            {copy.home.dek}
          </p>
          <p className="mt-3 max-w-2xl text-sm italic text-muted sm:text-base">
            {copy.home.kicker}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/$locale/research" params={{ locale }}>
                {copy.home.ctaResearch}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/$locale/media" params={{ locale }}>
                {copy.home.ctaMedia}
              </Link>
            </Button>
            {locale === "de" ? (
              <Button asChild variant="ghost">
                <Link to="/$locale/consulting" params={{ locale }}>
                  {copy.nav.consulting}
                </Link>
              </Button>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="py-20">
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

      {locale === "de" ? <ConsultingBand /> : null}

      <section className="border-t border-border py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl text-fg sm:text-4xl">
              {copy.home.mediaTitle}
            </h2>
            <p className="mt-3 max-w-lg text-muted">{copy.home.mediaDek}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/$locale/media" params={{ locale }}>
                  {copy.home.ctaMedia}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href={channels.teslatobi.url} target="_blank" rel="noreferrer">
                  {channels.teslatobi.handle}
                </a>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl">
            <img
              src="/images/media-field.jpg"
              alt=""
              className="aspect-photo w-full object-cover"
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20">
        <Container className="grid gap-8 md:grid-cols-12 md:items-center">
          <img
            src="/images/tobias.jpg"
            alt="Tobi Goebel"
            className="size-28 rounded-xl object-cover md:col-span-2 md:size-auto md:aspect-square"
          />
          <div className="md:col-span-7">
            <h2 className="font-display text-3xl text-fg">
              {copy.home.aboutTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-muted">{copy.home.aboutDek}</p>
          </div>
          <div className="md:col-span-3 md:justify-self-end">
            <Button asChild>
              <Link to="/$locale/about" params={{ locale }}>
                {copy.home.aboutCta}
              </Link>
            </Button>
            <p className="mt-3 font-mono text-xs text-faint">
              <a href={links.x} className="hover:text-fg">
                @tpgoebel
              </a>
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}

function ConsultingBand() {
  const locale = useLocale();
  const copy = useCopy();

  return (
    <section className="border-t border-border bg-surface">
      <Container className="grid gap-6 py-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {copy.nav.consulting}
          </p>
          <h2 className="mt-2 font-display text-3xl text-fg sm:text-4xl">
            Technik und Regulierung, auf Deutsch.
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Bezahlte Einordnung zum autonomen Fahren: Stand der Technik, StVG und
            AFGBV, EU- und UNECE-Regelwerk — was schon gilt, was in Arbeit ist.
          </p>
        </div>
        <div className="lg:col-span-4 lg:justify-self-end">
          <Button asChild>
            <Link to="/$locale/consulting" params={{ locale }}>
              {copy.about.consultCta}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
