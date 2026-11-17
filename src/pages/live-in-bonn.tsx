import { BonnShell } from "@/components/bonn-shell";
import { BonnOriginMap } from "@/components/bonn-origin-map";

/** Date and location are both fixed (Nov 17 2026). Venue stays off this page. */
const TERMIN_TEXT =
  "Termin und Ort stehen fest: Samstag, 19.12.2026, ab 18 Uhr in Bonn. Die meisten von Euch können an diesem Tag. Die genaue Adresse findet Ihr in den Event-Details.";

const SECTIONS = [
  { href: "#event-details", label: "Event-Details" },
  { href: "#eckdaten", label: "Eckdaten" },
  { href: "#worum", label: "Worum es geht" },
  { href: "#about", label: "Über uns" },
  { href: "#termin", label: "Termin" },
];

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
            <p className="sub">Samstag, 19.12.2026, ab 18 Uhr in Bonn · Ort steht fest</p>
            <div className="btns">
              <a className="btn btn-gold" href="/de/live-in-bonn/details">
                Zu den Event-Details
              </a>
              <a className="btn btn-ghost" href="#termin">
                Zum Termin
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

      <section id="event-details" aria-labelledby="h-details">
        <div className="wrap">
          <p className="label">Event-Details</p>
          <h2 id="h-details">Event-Details</h2>
          <p className="lead">
            Termin und Ort stehen fest: Samstag, 19.12.2026, ab 18 Uhr in Bonn. Die genaue Adresse und
            weitere Hinweise findet Ihr in den Event-Details.
          </p>
          <p>
            <a className="btn btn-gold" href="/de/live-in-bonn/details">
              Zu den Event-Details
            </a>
          </p>
        </div>
      </section>

      <section id="eckdaten" aria-labelledby="h-eck">
        <div className="wrap">
          <p className="label">Auf einen Blick</p>
          <h2 id="h-eck">Eckdaten</h2>
          <div className="grid4">
            <div className="card">
              <div className="hexicon" aria-hidden="true">1</div>
              <p className="label">Wann</p>
              <p className="val">19.12.2026</p>
              <p className="meta">Samstag, 19.12.2026, ab 18 Uhr. Dauer mindestens 4 bis 5 Stunden.</p>
            </div>
            <div className="card">
              <div className="hexicon" aria-hidden="true">2</div>
              <p className="label">Wo</p>
              <p className="val">Bonn</p>
              <p className="meta">Ort steht fest. Die genaue Adresse steht in den Event-Details.</p>
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
                Der Ort steht fest: in Bonn. Die genaue Adresse und weitere Hinweise findet Ihr in den
                Event-Details.
              </p>
              <span className="status s-run">Steht fest</span>
            </li>
            <li>
              <h3>2. Termin</h3>
              <p>Der Termin steht: Samstag, 19.12.2026, ab 18 Uhr in Bonn.</p>
              <span className="status s-run">Steht fest</span>
            </li>
            <li>
              <h3>3. Interesse bekunden</h3>
              <p>Die Interessenbekundung ist geschlossen. Danke an alle, die mitgemacht haben!</p>
              <span className="status s-run">Geschlossen</span>
            </li>
          </ol>
        </div>
      </section>

      <section id="termin" aria-labelledby="h-termin">
        <div className="wrap">
          <p className="label">Termin</p>
          <h2 id="h-termin">Termin</h2>
          <p className="lead">{TERMIN_TEXT}</p>
        </div>
      </section>

      <section id="anmeldung" aria-labelledby="h-anm">
        <div className="wrap">
          <p className="label">Dabei sein</p>
          <h2 id="h-anm">Interesse bekunden</h2>
          <p className="lead">
            Die Interessenbekundung ist geschlossen. Danke an alle, die mitgemacht haben!
          </p>
        </div>
      </section>
      <BonnOriginMap />
    </BonnShell>
  );
}
