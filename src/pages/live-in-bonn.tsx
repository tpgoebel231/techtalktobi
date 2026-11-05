import { useState } from "react";
import { BonnShell } from "@/components/bonn-shell";
import { BonnOriginMap } from "@/components/bonn-origin-map";

/** Google Form embed URL from the prototype (data-src). Loaded only on click. */
export const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSchGzla4kg2ynSqsMcxgu7vbR7Ly7NfMNJtC_1qc_MEoE9tRw/viewform?embedded=true";

/** First date proposals from the prototype. Plain list, not confirmed, no voting. */
const DATES = [
  { tag: "Samstag", d: "12.12.2026", zeit: "ab 18 Uhr" },
  { tag: "Sonntag", d: "13.12.2026", zeit: "tagsüber, ab 14 Uhr" },
  { tag: "Freitag", d: "18.12.2026", zeit: "ab 18 Uhr" },
  { tag: "Samstag", d: "19.12.2026", zeit: "ab 18 Uhr" },
  { tag: "Sonntag", d: "20.12.2026", zeit: "tagsüber, ab 14 Uhr" },
];

const SECTIONS = [
  { href: "#eckdaten", label: "Eckdaten" },
  { href: "#worum", label: "Worum es geht" },
  { href: "#about", label: "Über uns" },
  { href: "#termin", label: "Termin" },
  { href: "#anmeldung", label: "Interesse bekunden" },
];

const MAILTO = "mailto:tobias@techtalktobi.com?subject=Interesse%20Stammtisch%20Bonn";

/**
 * Two-click Google Form. The iframe src stays about:blank until the visitor
 * clicks, so no request goes to Google before that (§ 25 TDDDG).
 */
function GoogleFormTwoClick() {
  const [open, setOpen] = useState(false);
  const load = () => {
    if (/^https:\/\/docs\.google\.com\/forms\//.test(GOOGLE_FORM_URL)) setOpen(true);
  };
  return (
    <div className="gform card" id="signup">
      <div className={open ? "gform-frame is-open" : "gform-frame"}>
        <iframe
          id="gform"
          title="Formular zur Interessenbekundung (Google Forms)"
          hidden={!open}
          src={open ? GOOGLE_FORM_URL : "about:blank"}
          data-src={GOOGLE_FORM_URL}
        >
          Wird geladen…
        </iframe>
        <div className="gform-ph" id="gform-ph" hidden={open}>
          <div>
            <p style={{ margin: "0 0 12px" }}>
              <strong>Das Formular läuft bei Google (Server in den USA).</strong>
            </p>
            <p style={{ margin: "0 0 16px", fontWeight: 400 }}>
              Erst wenn du auf den Knopf klickst, wird das Formular von Google geladen und deine
              IP-Adresse geht an Google. Vorher passiert nichts. Mehr dazu in der{" "}
              <a href="/de/datenschutz#anmeldung">Datenschutzerklärung</a>. Lieber ohne Google?
              Schreib an <a href={MAILTO}>tobias@techtalktobi.com</a>.
            </p>
            {/* Label matches the wording quoted in /de/datenschutz. */}
            <button type="button" id="gform-load" className="btn btn-gold" onClick={load}>
              Formular von Google laden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveInBonnPage() {
  return (
    <BonnShell sections={SECTIONS}>
      <div className="hero" id="top">
        <div className="wrap">
          <div>
            <div className="pill">
              <span className="dot" aria-hidden="true" />
              LIVE IN BONN
            </div>
            <h1>
              TeslaTobi <span>Stammtisch</span>
            </h1>
            <p className="sub">Mitte Dezember 2026 · Bonn</p>
            <div className="btns">
              <a className="btn btn-gold" href="#anmeldung">
                INTERESSE BEKUNDEN
              </a>
              <a className="btn btn-ghost" href="#termin">
                Terminvorschläge
              </a>
            </div>
          </div>
          <img
            className="hero-logo"
            src="/live-in-bonn/logo-hex.png"
            alt="TeslaTobi Logo"
            width="280"
            height="280"
          />
        </div>
        <svg
          className="fiber"
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 60 C300 10 600 80 900 30 S1200 40 1200 40"
            fill="none"
            stroke="#8FD3FF"
            strokeWidth="1"
          />
        </svg>
      </div>

      <section id="eckdaten" aria-labelledby="h-eck">
        <div className="wrap">
          <p className="label">Auf einen Blick</p>
          <h2 id="h-eck">Eckdaten</h2>
          <div className="grid4">
            <div className="card">
              <div className="hexicon" aria-hidden="true">1</div>
              <p className="label">Wann</p>
              <p className="val">Dezember 2026</p>
              <p className="meta">Erste Terminvorschläge siehe unten. Dauer mindestens 4 bis 5 Stunden.</p>
            </div>
            <div className="card">
              <div className="hexicon" aria-hidden="true">2</div>
              <p className="label">Wo</p>
              <p className="val">Bonn</p>
              <p className="meta">
                Location wird noch gesucht. <span className="tbd">noch offen</span>
              </p>
            </div>
            <div className="card">
              <div className="hexicon" aria-hidden="true">3</div>
              <p className="label">Wer</p>
              <p className="val">Alle drei ssusamme</p>
              <p className="meta">Tobi + Zuschauer von TeslaTobi und TechTalkTobi 🙂</p>
            </div>
          </div>
        </div>
      </section>

      <section id="worum" aria-labelledby="h-worum">
        <div className="wrap two">
          <div>
            <p className="label">Die Idee</p>
            <h2 id="h-worum">Worum es geht</h2>
            <p>
              Der erste echte TeslaTobi Stammtisch zum Anfassen. Tobias ist im Dezember auf
              Heimaturlaub in Deutschland und lädt euch nach Bonn ein. Ein lockerer Abend, mit
              Gesprächen über Tesla, Technik und alles andere.
            </p>
            <p>
              Es gibt kein Programm und keine Bühne. Einfach zusammensitzen, sich kennenlernen und
              Spaß haben.
            </p>
          </div>
          <ul className="hexlist hexlist-idee">
            <li>Lockerer Abend, kein Programm</li>
            <li>Vielleicht gibt's was zu gewinnen 🙃</li>
            <li>Spaß haben</li>
          </ul>
        </div>
      </section>

      <section aria-label="Foto" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <figure className="photo photo-wide">
            <img
              src="/live-in-bonn/stammtisch-kneipe-v2.jpg"
              width="1800"
              height="1005"
              loading="lazy"
              alt="Symbolbild: Eine Gruppe lächelnder Menschen steht in einer gemütlichen Kneipe um Holztische, einige halten Biergläser."
            />
            {/* Deliberate joke by Tobias (AI image, no meetup yet). Keep as is. */}
            <figcaption>Symbolbild</figcaption>
          </figure>
        </div>
      </section>

      <section id="about" aria-labelledby="h-about">
        <div className="wrap about-grid">
          <figure className="photo photo-portrait">
            <img
              src="/live-in-bonn/tobias-portrait-v2.jpg"
              width="864"
              height="1080"
              loading="lazy"
              alt="Porträt von Tobias Goebel, lächelnd, im dunklen Sakko mit weißem Hemd"
            />
            <figcaption>Tobias</figcaption>
          </figure>
          <div>
            <p className="label">Über uns</p>
            <h2 id="h-about">Wie alles entstand</h2>
            <p>
              Ich lebe seit über zwölf Jahren in Boston, komme aber aus dem Rheinland. Beim
              Oktober-Stammtisch am 29. Oktober 2026 schrieb ein Zuschauer "Stammtisch live vor Ort
              in Deutschland". Da fiel mir wieder ein, dass ich mal davon geträumt habe, in Bonn
              eine Halle voller TeslaTobi Zuschauer zu haben. Für so eine große Sache dachte ich
              eigentlich, das schaffe ich nie.
            </p>
            <p>
              Ich habe trotzdem gefragt, wer sich vorstellen könnte, zu einem Treffen in Bonn zu
              kommen, ganz ungezwungen, vielleicht in einer Kneipe. Ihr habt eine Eins in den Chat
              geschrieben, rund zwanzig von euch, und einige würden dafür sogar mehrere hundert
              Kilometer Anfahrt in Kauf nehmen 🥹. Im Dezember bin ich ohnehin ein paar Wochen im Rheinland. Also machen wir
              es.
            </p>
            <blockquote>
              „In ein paar Jahren kann man dann sagen, ja der TeslaTobi, damals in Bonn das kleine
              Treffen, ich war dabei." <span className="meta">Zuschauer im Chat 😅</span>
            </blockquote>
            <p>
              Danach kamen noch viele Ideen von euch. Genau so soll es werden: klein und gemütlich.
              Diese Seite war übrigens auch eure Idee. Erzeugt von Grok Bot, wem sonst.
            </p>
          </div>
        </div>
      </section>

      <section id="stand" aria-labelledby="h-stand">
        <div className="wrap">
          <p className="label">Fortschritt</p>
          <h2 id="h-stand">Stand der Planung</h2>
          <ol className="tl">
            <li>
              <h3>1. Location</h3>
              <p>
                Suche nach einem Nebenraum in einer Kneipe oder einem Restaurant in Bonn. Tipps aus
                der Community sind willkommen.
              </p>
              <span className="status s-run">Läuft</span>
            </li>
            <li>
              <h3>2. Termin</h3>
              <p>Erste Vorschläge stehen unten. Danach legen wir das Datum fest.</p>
              <span className="status s-run">Läuft</span>
            </li>
            <li>
              <h3>3. Interesse bekunden</h3>
              <p>Geht schon jetzt, siehe unten. Ort und Termin folgen.</p>
              <span className="status s-run">Läuft</span>
            </li>
          </ol>
        </div>
      </section>

      <section id="termin" aria-labelledby="h-termin">
        <div className="wrap">
          <p className="label">Termin</p>
          <h2 id="h-termin">Terminvorschläge</h2>
          <p className="lead">
            <strong>Die Termine sind erste Vorschläge</strong>, noch nicht bestätigt. Uhrzeiten
            ungefähr.
          </p>
          <ul className="dates">
            {DATES.map((x) => (
              <li key={x.d}>
                <span className="day">{x.tag}</span>
                <span className="d">{x.d}</span>
                <span className="meta">{x.zeit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="anmeldung" aria-labelledby="h-anm">
        <div className="wrap">
          <p className="label">Dabei sein</p>
          <h2 id="h-anm">Interesse bekunden</h2>
          {/* Required fields: Google Form as specified by Tobias on Nov 2 2026. */}
          <p className="lead">
            Damit Tobias eine Vorstellung davon bekommt, wie groß er planen muss. Pflicht sind nur
            dein Vorname, dein Nachname, deine E-Mail-Adresse, dein Bundesland, mindestens ein
            möglicher Termin, die Bestätigung, dass du mindestens 18 bist, und deine Einwilligung zu
            Google. Alles andere ist
            freiwillig.
          </p>
          <GoogleFormTwoClick />
          <div className="note gform-note" role="note">
            <p>
              <strong>Hinweis zum Datenschutz:</strong> Das Formular wird erst nach deinem Klick von
              Google geladen und läuft bei Google. Deine Angaben werden auf Servern in den USA
              gespeichert. Zweck: nur die Interessenbekundung. Löschung spätestens 30 Tage nach dem Event.
            </p>
            <p>
              <strong>Lieber ohne Google?</strong> Schreib einfach eine E-Mail an{" "}
              <a href={MAILTO}>tobias@techtalktobi.com</a> mit Name und ob du mit Tesla kommst.
            </p>
          </div>
        </div>
      </section>
      <BonnOriginMap />
    </BonnShell>
  );
}
