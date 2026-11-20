import type { PrivacyPage } from "@/data/privacy-en";

/**
 * German privacy notes for Google OAuth / YouTube Data API access,
 * plus website analytics and consent. Live at /de/privacy.
 * Copy from Colleen (privacy-de.md and privacy-ga-section-de.md), used verbatim.
 */
export const privacyDe: PrivacyPage = {
  title: "Datenschutzhinweise zur Google- und YouTube-API",
  description:
    "Wie Tobias Goebel den Zugriff auf die Google- und YouTube-API über TechTalkTobi nutzt, um seine eigenen YouTube-Kanäle zu verwalten.",
  blocks: [
    { p: "Stand: 9. November 2026" },

    { h2: "Wer das betreibt" },
    {
      p: "Die Website TechTalkTobi (techtalktobi.com) und ihr Google-API-Client werden von Tobias Goebel betrieben.",
    },

    { h2: "Zugriff auf die Google- und YouTube-API" },
    {
      p: "Der Zugriff auf die YouTube Data API v3 (Scopes youtube.upload, youtube und youtube.force-ssl) wird ausschließlich von Tobias selbst genutzt, um Videos auf seinen eigenen YouTube-Kanälen TeslaTobi und TechTalk-Tobi hochzuladen und zu verwalten.",
    },
    {
      p: "Über diesen Zugriff werden keine Daten anderer Nutzer erhoben, gespeichert, verkauft oder weitergegeben.",
    },
    {
      p: "OAuth-Tokens werden privat auf seinen eigenen Computern aufbewahrt und niemals weitergegeben.",
    },

    { h2: "Richtlinien von Google und YouTube" },
    {
      p: "Für die Nutzung der Google- und YouTube-APIs gelten zusätzlich die Datenschutzerklärung von Google (https://policies.google.com/privacy) und die Nutzungsbedingungen von YouTube (https://www.youtube.com/t/terms).",
    },

    { h2: "Website-Analyse und Einwilligung" },
    {
      p: "Ich nutze Google Analytics 4, um zu sehen, wie diese Website genutzt wird: welche Seiten aufgerufen werden, wie Besucher hierher kommen (zum Beispiel über eine Suchmaschine oder einen Link) und grob, mit welchem Gerät, Browser und aus welcher Region. So weiß ich, worüber es sich lohnt, mehr zu schreiben. Ich nutze das nicht, um Sie zu identifizieren, und es hat nichts mit dem oben beschriebenen Zugriff auf die YouTube-API zu tun.",
    },
    {
      p: "Google Analytics läuft erst, nachdem Sie im Einwilligungsbanner auf Akzeptieren geklickt haben. Bis dahin wird nichts von Google Analytics geladen und es werden keine Analyse-Cookies gesetzt. Wenn Sie ablehnen, bleibt es dabei. Ihre Entscheidung wird nur in Ihrem eigenen Browser (localStorage) gespeichert, damit das Banner nicht auf jeder Seite erneut fragt.",
    },
    {
      p: "Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.",
    },
    {
      p: "Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen: Klicken Sie unten auf jeder Seite auf Cookie-Einstellungen und ändern Sie dort Ihre Auswahl.",
    },
    {
      p: "Wenn Sie zustimmen, gehen die Nutzungsdaten an Google (Google Ireland Limited, mit Verarbeitung durch Google LLC in den USA). Eine Übermittlung in die USA ist damit möglich. Wie Google mit diesen Daten umgeht, steht in der Datenschutzerklärung von Google (https://policies.google.com/privacy).",
    },
    {
      p: "Die Schriften dieser Website liegen auf dem eigenen Server. Beim Laden einer Seite werden deshalb keine Anfragen an Google Fonts gesendet.",
    },
    {
      p: "Für die deutschen Seiten zu Live in Bonn gilt die eigene Datenschutzerklärung unter https://techtalktobi.com/de/datenschutz.",
    },

    { h2: "Kontakt" },
    {
      p: "Fragen zu diesen Hinweisen: info@techtalktobi.com.",
    },
  ],
};
