import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { LocaleProvider } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { isCleanPath } from "@/lib/clean-routes";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw redirect({ to: "/$locale", params: { locale: "en" } });
    }
  },
  head: ({ params }) => {
    const de = params.locale === "de";
    return {
      meta: [
        {
          title: de
            ? "Tobias P. Goebel (TeslaTobi) | Medien & Beratung"
            : "Tobias P. Goebel (TeslaTobi) | Media & Advisory",
        },
        {
          name: "description",
          content: de
            ? "Journalist und Berater für autonome Systeme. TeslaTobi, TechTalkTobi, öffentliche Analysen. Beratung zu Technik und Regulierung. Online: tpgoebel."
            : "Journalist and advisor on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Advisory on the technology and the rules. Online: tpgoebel.",
        },
      ],
    };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  const safe = isLocale(locale) ? locale : "en";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Clean routes bring their own minimal shell (no Google Fonts styling).
  if (isCleanPath(pathname)) {
    return (
      <LocaleProvider locale={safe}>
        <Outlet />
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider locale={safe}>
      <SiteShell>
        <Outlet />
      </SiteShell>
    </LocaleProvider>
  );
}
