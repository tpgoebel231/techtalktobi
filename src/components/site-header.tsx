import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { LangSwitcher } from "@/components/lang-switcher";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCopy, useLocale } from "@/lib/i18n";

type NavItem = { to: string; label: string };

export function SiteHeader() {
  const locale = useLocale();
  const copy = useCopy();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { to: "/$locale/media", label: copy.nav.media },
    { to: "/$locale/research", label: copy.nav.research },
    { to: "/$locale/consulting", label: copy.nav.consulting },
    { to: "/$locale/about", label: copy.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex items-center gap-3 text-fg no-underline"
          aria-label={copy.brand.name}
        >
          <Mark className="size-10 shrink-0 sm:size-11" alt="" />
          <span className="leading-tight">
            <span className="block font-display text-[15px] tracking-tight sm:text-lg">
              {copy.brand.name}
            </span>
            <span className="hidden font-mono text-[10px] tracking-widest text-muted uppercase sm:block">
              {copy.brand.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label={copy.nav.primary}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ locale }}
              className="text-sm text-muted no-underline transition-colors duration-150 hover:text-fg"
              activeProps={{ className: "text-fg" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={copy.nav.menu}
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="flex items-center gap-3 pr-8">
                <Mark className="size-8" alt="" />
                {copy.brand.name}
              </SheetTitle>
              <nav className="mt-8 flex flex-col gap-1" aria-label={copy.nav.menu}>
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    params={{ locale }}
                    className="flex h-12 items-center text-lg text-fg no-underline"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-6">
                  <LangSwitcher />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
