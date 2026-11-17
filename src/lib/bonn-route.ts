import { redirect } from "@tanstack/react-router";
import bonnCss from "../styles/live-in-bonn.css?url";

type BonnPath = "/$locale/live-in-bonn" | "/$locale/live-in-bonn/details" | "/$locale/datenschutz";

/** German-only pages: /en/... redirects to the /de/... page. */
export function requireDe(locale: string, to: BonnPath) {
  if (locale !== "de") throw redirect({ to, params: { locale: "de" } });
}

export function bonnHead(title: string, description: string, extra?: { robots?: string }) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(extra?.robots ? [{ name: "robots", content: extra.robots }] : []),
    ],
    links: [{ rel: "stylesheet", href: bonnCss }],
  };
}
