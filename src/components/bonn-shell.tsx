import type { ReactNode } from "react";

/**
 * Minimal shell for the Live in Bonn page and the German legal pages.
 * Plain <a> links on purpose: leaving to the main site is a full page load,
 * so GA4 never runs inside these clean routes.
 */
export function BonnShell({
  children,
  sections,
}: {
  children: ReactNode;
  sections?: { href: string; label: string }[];
}) {
  return (
    <div className="lib">
      <a className="skip" href="#inhalt">
        Zum Inhalt springen
      </a>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="/de/live-in-bonn" aria-label="TeslaTobi Stammtisch, Live in Bonn">
            <img src="/live-in-bonn/logo-hex.png" alt="" width="56" height="56" />
            <span>Live in Bonn</span>
          </a>
          {sections ? (
            <nav className="sections" aria-label="Abschnitte">
              <ul>
                {sections.map((s) => (
                  <li key={s.href}>
                    <a href={s.href}>{s.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </header>
      <main id="inhalt">{children}</main>
      <footer>
        <div className="wrap">
          <p>
            TeslaTobi Stammtisch · Live in Bonn · Ohne Tracking. Die Anmeldung läuft über Google
            Forms (Server in den USA).
          </p>
          <p>
            <a href="/de/datenschutz">Datenschutz</a> · <a href="/de/impressum">Impressum</a> ·{" "}
            <a href="/de">techtalktobi.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
