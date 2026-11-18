import { FormEvent, useEffect, useState } from "react";
import { BonnShell } from "@/components/bonn-shell";
import payload from "@/data/live-in-bonn-details.enc.json";
import {
  decryptEventDetails,
  type EncryptedPayload,
  type EventDetails,
  type EventPhoto,
  type EventSection,
} from "@/lib/live-in-bonn-details-crypto";

const STORAGE_KEY = "ttt-lib-details-pw";
const encPayload = payload as EncryptedPayload;

export function LiveInBonnDetailsPage() {
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    let cancelled = false;
    void decryptEventDetails(saved, encPayload)
      .then((next) => {
        if (!cancelled) setDetails(next);
      })
      .catch(() => {
        sessionStorage.removeItem(STORAGE_KEY);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    setBusy(true);
    try {
      const next = await decryptEventDetails(password, encPayload);
      sessionStorage.setItem(STORAGE_KEY, password);
      setDetails(next);
    } catch {
      setError("Das Passwort stimmt nicht.");
    } finally {
      setBusy(false);
    }
  }

  if (!details) {
    return (
      <BonnShell>
        <section className="details-gate" aria-labelledby="h-details">
          <div className="wrap">
            <p className="label">Live in Bonn</p>
            <h1 id="h-details">Event-Details</h1>
            <p>
              <a href="/de/live-in-bonn">Zurück zur Übersichtsseite</a>
            </p>
            <p className="lead">
              Termin und Ort stehen fest. Die genaue Adresse und weitere Hinweise sind
              passwortgeschützt.
            </p>
            <form className="pw-form" onSubmit={onSubmit}>
              <label htmlFor="lib-password">Passwort</label>
              <input
                id="lib-password"
                name="password"
                type="password"
                autoComplete="off"
                required
                disabled={busy}
              />
              <button className="btn btn-gold" type="submit" disabled={busy}>
                Anzeigen
              </button>
              {error ? (
                <p className="pw-error" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </BonnShell>
    );
  }

  const hero = details.lokal.photos.find((photo) => photo.hero) ?? details.lokal.photos[0];

  return (
    <BonnShell>
      <section className="details-hero" aria-labelledby="h-details">
        <div className="details-hero-media" aria-hidden="true">
          <img src={hero.src} alt="" />
        </div>
        <div className="wrap">
          <p className="label">Live in Bonn</p>
          <h1 id="h-details">Event-Details</h1>
          <p className="sub">{details.datum}</p>
          <p className="details-hero-venue">
            <a href={details.maps} target="_blank" rel="noopener noreferrer">
              {details.ort}
            </a>
          </p>
          <p>
            <a className="details-back" href="/de/live-in-bonn">
              Zurück zur Übersichtsseite
            </a>
          </p>
          <p className="details-hero-credit">
            <a href={hero.href} target="_blank" rel="noopener noreferrer">
              {hero.credit}
            </a>
          </p>
        </div>
      </section>

      <section className="details-facts" aria-label="Eckdaten">
        <div className="wrap">
          <dl className="event-facts">
            <div>
              <dt>Datum</dt>
              <dd>{details.datum}</dd>
            </div>
            <div>
              <dt>Ort</dt>
              <dd>
                <a href={details.maps} target="_blank" rel="noopener noreferrer">
                  {details.ort}
                </a>
              </dd>
            </div>
            <div>
              <dt>Parken</dt>
              <dd>{details.parken}</dd>
            </div>
            <div>
              <dt>Küche</dt>
              <dd>{details.kueche}</dd>
            </div>
          </dl>
        </div>
      </section>

      <DetailSection section={details.lokal} anchor="das-lokal" />
      <DetailSection section={details.markt} anchor="weihnachtsmarkt" />

      <section className="details-more">
        <div className="wrap">
          <p>{details.mehr}</p>
        </div>
      </section>
    </BonnShell>
  );
}

function DetailSection({ section, anchor }: { section: EventSection; anchor: string }) {
  const headingId = `h-${anchor}`;
  return (
    <section className="event-extra" id={anchor} aria-labelledby={headingId}>
      <div className="wrap">
        <p className="label">{section.title}</p>
        <h2 id={headingId}>{section.title}</h2>
        <p className="lead">{section.text}</p>
        <div className="event-gallery">
          {section.photos.map((photo) => (
            <GalleryFigure key={photo.href} photo={photo} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryFigure({ photo }: { photo: EventPhoto }) {
  return (
    <figure>
      <img src={photo.src} alt={photo.alt} />
      <figcaption>
        <a href={photo.href} target="_blank" rel="noopener noreferrer">
          {photo.credit}
        </a>
      </figcaption>
    </figure>
  );
}
