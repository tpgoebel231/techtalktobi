import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { advisory } from "@/data/consulting";
import { links } from "@/data/media";
import { useLocale } from "@/lib/i18n";

export function ConsultingPage() {
  const locale = useLocale();
  const copy = advisory[locale];
  const mail = `mailto:${links.email}?subject=${encodeURIComponent(copy.mailSubject)}`;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/consulting-desk.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-bg/75" />
        <Container className="relative py-20 sm:py-28">
          <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fg/90">{copy.dek}</p>
          <div className="mt-8">
            <Button asChild>
              <a href={mail}>{copy.cta}</a>
            </Button>
            <p className="mt-3 text-sm text-muted">{copy.ctaHint}</p>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <h2 className="font-display text-3xl text-fg">{copy.offerTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {copy.offer.map((item, i) => (
            <article
              key={item.title}
              className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]"
            >
              <p className="font-mono text-xs text-accent tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg font-medium text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-fg">{copy.whoTitle}</h2>
            <ul className="mt-6 space-y-3">
              {copy.who.map((item) => (
                <li key={item} className="border-l-2 border-accent pl-4 text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-fg">{copy.formatTitle}</h2>
            <ul className="mt-6 space-y-5">
              {copy.formats.map((item) => (
                <li key={item.title}>
                  <p className="font-medium text-fg">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)]">
          <p className="max-w-2xl text-muted">{copy.aside}</p>
          <div className="mt-6">
            <Button asChild>
              <a href={mail}>{copy.cta}</a>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
