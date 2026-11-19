import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { LocaleProvider } from "@/lib/i18n";
import { PrivacyPage } from "@/pages/privacy";

const TITLE = "Privacy Policy · TechTalkTobi";
const DESCRIPTION =
  "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.";

/**
 * Root /privacy (the URL in the footer, the sitemap and the Google OAuth
 * consent screen). It must be its own static route: without it the client
 * router matches /$locale with locale "privacy" and redirects to /en after
 * hydration, so Google reports /privacy as "Page with redirect".
 */
export const Route = createFileRoute("/privacy")({
  component: RootPrivacyPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
    ],
  }),
});

function RootPrivacyPage() {
  return (
    <LocaleProvider locale="en">
      <SiteShell>
        <PrivacyPage />
      </SiteShell>
    </LocaleProvider>
  );
}
