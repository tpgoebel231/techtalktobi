import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Tobias P. Goebel";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Tobias P. Goebel — media and advisory on autonomous systems. TeslaTobi, TechTalkTobi, published analysis. Online: tpgoebel.",
      },
      { name: "theme-color", content: "#0B0D11" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: RootDocument,
  notFoundComponent: NotFound,
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

function NotFound() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const de = pathname.startsWith("/de");

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">
        404
      </p>
      <h1 className="font-display text-4xl leading-tight text-fg">
        {de ? "Diese Seite gibt es nicht." : "This road is closed."}
      </h1>
      <p className="text-muted">
        {de
          ? "Unter dieser Adresse liegt keine Seite. Zurück zur Startseite."
          : "That page is not on this map. Head back to the site."}
      </p>
      <p className="flex gap-4 text-sm">
        <a href="/en" className="text-accent hover:underline">
          English
        </a>
        <a href="/de" className="text-accent hover:underline">
          Deutsch
        </a>
      </p>
    </main>
  );
}
