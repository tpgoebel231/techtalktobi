import { Link } from "@tanstack/react-router";
import { Mail, Youtube } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { links } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function AboutPage() {
  const locale = useLocale();
  const copy = useCopy();

  const contacts = [
    {
      label: "@tpgoebel",
      href: links.x,
      hint: "X",
    },
    {
      label: "@TeslaTobi",
      href: links.teslaTobi,
      hint: "YouTube",
    },
    {
      label: "@TechTalk-Tobi",
      href: links.techTalk,
      hint: "YouTube",
    },
    {
      label: links.email,
      href: `mailto:${links.email}`,
      hint: "Email",
    },
  ];

  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img
            src="/images/tobias.jpg"
            alt="Tobi Goebel"
            className="w-full rounded-xl object-cover"
          />
        </div>
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {copy.about.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-fg sm:text-6xl">
            {copy.about.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{copy.about.dek}</p>
          <div className="mt-8 flex flex-col gap-5">
            {copy.about.body.map((p) => (
              <p key={p} className="max-w-2xl text-base leading-relaxed text-fg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-20 border-t border-border pt-12">
        <h2 className="font-display text-3xl text-fg">{copy.about.contact}</h2>
        <ul className="mt-6 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {contacts.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noreferrer"
                className="flex h-16 items-center justify-between gap-4 px-5 no-underline hover:bg-surface-2"
              >
                <span className="flex items-center gap-3 text-fg">
                  {item.hint === "Email" ? (
                    <Mail className="size-4 text-muted" />
                  ) : item.hint === "YouTube" ? (
                    <Youtube className="size-4 text-muted" />
                  ) : (
                    <span className="w-4 text-center font-mono text-xs text-muted">
                      X
                    </span>
                  )}
                  {item.label}
                </span>
                <span className="font-mono text-[11px] text-faint">{item.hint}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/$locale/media-kit" params={{ locale }}>
              {copy.about.mediaKitCta}
            </Link>
          </Button>
          {locale === "de" ? (
            <Button asChild variant="outline">
              <Link to="/$locale/consulting" params={{ locale }}>
                {copy.about.consultCta}
              </Link>
            </Button>
          ) : (
            <p className="flex items-center text-sm text-muted">
              {copy.about.consultNote}{" "}
              <Link
                to="/$locale/consulting"
                params={{ locale: "de" }}
                className="ml-2 text-accent"
              >
                {copy.about.consultCta}
              </Link>
            </p>
          )}
        </div>
      </section>
    </Container>
  );
}
