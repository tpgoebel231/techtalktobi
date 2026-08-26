import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { LocaleProvider } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw redirect({ to: "/$locale", params: { locale: "en" } });
    }
  },
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.locale === "de"
            ? "TechTalkTobi — Die Autonomie-Revolution im Blick"
            : "TechTalkTobi — Tracking the Autonomy Revolution",
      },
    ],
  }),
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  const safe = isLocale(locale) ? locale : "en";

  return (
    <LocaleProvider locale={safe}>
      <SiteShell>
        <Outlet />
      </SiteShell>
    </LocaleProvider>
  );
}
