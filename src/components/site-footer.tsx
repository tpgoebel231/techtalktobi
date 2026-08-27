import { Link } from "@tanstack/react-router";
import { Container } from "@/components/container";
import { LangSwitcher } from "@/components/lang-switcher";
import { Mark } from "@/components/mark";
import { links } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function SiteFooter() {
  const locale = useLocale();
  const copy = useCopy();

  return (
    <footer className="border-t border-border print:hidden">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="flex items-center gap-3 font-display text-lg tracking-tight text-fg">
            <Mark className="size-8" alt="" />
            {copy.footer.mark}
          </p>
          <p className="mt-3 font-display text-xl text-muted">{copy.footer.line}</p>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            {copy.footer.rights}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link
            to="/$locale/media"
            params={{ locale }}
            className="text-muted no-underline hover:text-fg"
          >
            {copy.nav.media}
          </Link>
          <Link
            to="/$locale/research"
            params={{ locale }}
            className="text-muted no-underline hover:text-fg"
          >
            {copy.nav.research}
          </Link>
          <Link
            to="/$locale/consulting"
            params={{ locale }}
            className="text-muted no-underline hover:text-fg"
          >
            {copy.nav.consulting}
          </Link>
          <Link
            to="/$locale/about"
            params={{ locale }}
            className="text-muted no-underline hover:text-fg"
          >
            {copy.nav.about}
          </Link>
          <a
            href={links.x}
            className="text-muted no-underline hover:text-fg"
            rel="noreferrer"
            target="_blank"
          >
            @{copy.brand.handle}
          </a>
          <a
            href={`mailto:${links.email}`}
            className="text-muted no-underline hover:text-fg"
          >
            {links.email}
          </a>
          <LangSwitcher />
        </div>
      </Container>
    </footer>
  );
}
