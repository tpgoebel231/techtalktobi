import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { gaConsentBootstrap } from "@/data/analytics";
import { isCleanPath } from "@/lib/clean-routes";
import { NotFoundPage } from "@/pages/not-found";
import appCss from "../styles.css?url";
import fontsCss from "../fonts.css?url";

const APP_NAME = "Tobias P. Goebel";

export const Route = createRootRoute({
  head: ({ matches }) => {
    // Clean routes (src/lib/clean-routes.ts) skip GA4 and the site fonts.
    const clean = isCleanPath(matches[matches.length - 1]?.pathname);
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Tobias P. Goebel: media and advisory on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Online: tpgoebel.",
      },
      { name: "theme-color", content: "#0B0D11" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      ...(clean
        ? []
        : [
            // Self-hosted fonts (src/fonts.css), no Google Fonts request.
            { rel: "stylesheet", href: fontsCss },
          ]),
    ],
    scripts: clean
      ? []
      : [
          // Consent Mode v2: all storage denied; gtag.js loads only after
          // Accept (src/components/consent-banner.tsx).
          {
            children: gaConsentBootstrap,
          },
        ],
    };
  },
  component: RootDocument,
  notFoundComponent: NotFoundPage,
});

function RootDocument() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = pathname.startsWith("/de") ? "de" : "en";

  return (
    <html lang={lang} className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
