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
    { to: "/$locale/research", label: copy.nav.research },
    { to: "/$locale/media", label: copy.nav.media },
    { to: "/$locale/about", label: copy.nav.about },
  ];

  if (locale === "de") {
    items.push({ to: "/$locale/consulting", label: copy.nav.consulting });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex items-center gap-3 text-fg no-underline"
        >
          <Mark className="size-8 shrink-0 rounded-sm shadow-[var(--shadow-border)]" />
          <span className="leading-tight">
            <span className="block font-medium tracking-tight">TechTalkTobi</span>
            <span className="hidden font-mono text-[10px] tracking-widest text-muted uppercase sm:block">
              Autonomy desk
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
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
                aria-label="Menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="pr-8">TechTalkTobi</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile">
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
