import { redirect } from "@tanstack/react-router";
import bonnCss from "../styles/live-in-bonn.css?url";

/** German-only pages: /en/... redirects to the /de/... page. */
export function requireDe(locale: string, to: "/$locale/live-in-bonn" | "/$locale/impressum" | "/$locale/datenschutz") {
  if (locale !== "de") throw redirect({ to, params: { locale: "de" } });
}

export function bonnHead(title: string, description: string) {
  return {
    meta: [{ title }, { name: "description", content: description }],
    links: [{ rel: "stylesheet", href: bonnCss }],
  };
}
