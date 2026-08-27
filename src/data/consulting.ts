import type { Locale } from "@/lib/locale";

type AdvisoryCopy = {
  eyebrow: string;
  title: string;
  dek: string;
  offerTitle: string;
  offer: { title: string; body: string }[];
  whoTitle: string;
  who: string[];
  formatTitle: string;
  formats: { title: string; body: string }[];
  cta: string;
  ctaHint: string;
  mailSubject: string;
  aside: string;
};

export const advisory: Record<Locale, AdvisoryCopy> = {
  en: {
    eyebrow: "Advisory",
    title: "What these systems do — and what the rules allow",
    dek: "Paid, independent briefings in English. I drive these systems in US daily use and read the European rulebook. That gap is the work.",
    offerTitle: "What I brief",
    offer: [
      {
        title: "State of the technology",
        body: "What Tesla FSD, Waymo, and the rest of the field can actually do. SAE levels versus marketing language. Supervised vs. unsupervised vs. robotaxi — without the slide fog.",
      },
      {
        title: "US practice → European rules",
        body: "I use these systems in Boston. English-speaking teams get a clear map of what transfers to Germany, the EU, and UNECE — and what does not.",
      },
      {
        title: "UNECE, EU, German law",
        body: "What is already in force and what is still coming: UNECE R157 / R171 and successors, WP.29, the AI Act where it touches driving functions, and vehicle-data questions.",
      },
      {
        title: "Due diligence without the fanboy briefing",
        body: "An independent read for counsel, strategy, and investors who need to know where the software ends and the regulation begins.",
      },
    ],
    whoTitle: "For whom",
    who: [
      "OEMs, suppliers, tier-1 strategy and product",
      "Counsel and policy teams that need the technology straight",
      "English-speaking teams facing German or EU deployment questions",
      "Investors who want due diligence without a fanboy briefing",
      "Newsrooms and documentary teams",
    ],
    formatTitle: "Formats",
    formats: [
      {
        title: "Briefing",
        body: "90 minutes, a clear question list, written notes afterwards.",
      },
      {
        title: "Workshop",
        body: "A half or full day with the team. Technology and regulation in one room.",
      },
      {
        title: "Ongoing read",
        body: "Regular notes on releases, hearings, and UNECE texts — before they become a slide.",
      },
    ],
    cta: "Request a briefing",
    ctaHint: "A short note on the question is enough. I reply in English.",
    mailSubject: "Advisory inquiry — autonomy",
    aside:
      "Independent. No mandate from Tesla, Waymo, or any OEM. A fan of the technology, not of the press release. Deep German regulatory work is also available in German.",
  },
  de: {
    eyebrow: "Beratung",
    title: "Autonomes Fahren — Technik und Regulierung",
    dek: "Bezahlte, unabhängige Einordnung auf Deutsch. Für Teams, die den Stand der Technik brauchen — und das Regelwerk, das schon gilt oder noch kommt.",
    offerTitle: "Wobei ich helfe",
    offer: [
      {
        title: "Stand der Technik",
        body: "Was Tesla FSD, Waymo und das übrige Feld heute wirklich können. SAE-Stufen gegen Marketingsprache. Supervised vs. Unsupervised vs. Robotaxi — ohne Foliennebel.",
      },
      {
        title: "Nationales Recht",
        body: "StVG, AFGBV, Typgenehmigung in Deutschland. Wer ist Fahrer, wer Halter, wer Betreiber. Was ein Pilot auf öffentlichen Straßen tatsächlich braucht.",
      },
      {
        title: "EU und UNECE",
        body: "Was schon gilt und was noch kommt: UNECE R157 / R171 und Nachfolger, WP.29, der AI Act soweit er Fahrfunktionen berührt, DSGVO-Fragen zu Fahrzeugdaten.",
      },
      {
        title: "Übersetzung USA → Europa",
        body: "Ich fahre die Systeme im US-Alltag. Die Lücke zwischen dem, was in Boston läuft, und dem, was in Berlin erlaubt ist, ist genau mein Arbeitsgebiet.",
      },
    ],
    whoTitle: "Für wen",
    who: [
      "OEMs, Zulieferer, Strategie und Produkt bei Tier-1",
      "Ministerien, Landesbehörden, kommunale Pilotprojekte",
      "Kanzleien und Teams in Politik und Regulierung, die die Technik brauchen",
      "Redaktionen und Doku-Teams",
      "Investoren, die Due Diligence ohne Fanboy-Briefing wollen",
    ],
    formatTitle: "Formate",
    formats: [
      {
        title: "Briefing",
        body: "90 Minuten, klarer Fragenkatalog, schriftliche Stichpunkte danach.",
      },
      {
        title: "Workshop",
        body: "Halber oder ganzer Tag mit dem Team. Technik und Regulierung in einem Raum.",
      },
      {
        title: "Laufende Einordnung",
        body: "Regelmäßige Einordnung zu Softwareständen, Anhörungen und UNECE-Texten — bevor sie zur Folie werden.",
      },
    ],
    cta: "Gespräch anfragen",
    ctaHint: "Kurz schreiben, worum es geht. Ich antworte auf Deutsch.",
    mailSubject: "Beratungsanfrage autonomes Fahren",
    aside:
      "Unabhängig. Kein Mandat von Tesla, Waymo oder einem deutschen OEM. Fan der Technik, nicht der Pressemitteilung. Englische Briefings zur Übersetzung zwischen US-Praxis und europäischem Recht gibt es parallel.",
  },
};
