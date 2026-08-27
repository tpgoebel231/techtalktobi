import { Link } from "@tanstack/react-router";
import { Mail, Youtube } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { links } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function AboutPage() {
  const locale = useLocale();
  const copy = useCopy();

  const reach = [
    {
      label: links.email,
      href: `mailto:${links.email}`,
      hint: "Email",
    },
    {
      label: "@tpgoebel",
      href: links.x,
      hint: "X",
    },
  ];

  const channelRows = [
    {
      label: "TeslaTobi (YouTube)",
      href: links.teslaTobi,
      hint: "YouTube",
    },
    {
      label: "TechTalkTobi (YouTube)",
      href: links.techTalk,
      hint: "YouTube",
    },
  ];

  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <img
            src="/images/tobias.jpg"
            alt={copy.brand.name}
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

        <h3 className="mt-8 text-sm font-medium tracking-wide text-muted uppercase">
          {copy.about.reach}
        </h3>
        <ContactList rows={reach} />

        <h3 className="mt-10 text-sm font-medium tracking-wide text-muted uppercase">
          {copy.about.channels}
        </h3>
        <ContactList rows={channelRows} />

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a href={links.mediaKit} download>
              {copy.about.mediaKitCta}
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/$locale/consulting" params={{ locale }}>
              {copy.about.consultCta}
            </Link>
          </Button>
        </div>
      </section>
    </Container>
  );
}

function ContactList({
  rows,
}: {
  rows: { label: string; href: string; hint: string }[];
}) {
  return (
    <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
      {rows.map((item) => (
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
  );
}
