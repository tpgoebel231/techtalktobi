/**
 * German privacy statement for the Live in Bonn page (/de/datenschutz).
 * Lean version per Tobias (Nov 1 2026): based on the Corporate Lawyer draft
 * /workspace/legal/stammtisch-bonn/datenschutz-de.md with Option D (Google
 * Forms embedded, two-click) and text block (iv) from formular-langfristig.md.
 * The form fields listed below match the live Google Form as checked on
 * Nov 1 2026. If the form changes, update section 4 and the page copy.
 *
 * GUARD: scripts/check-legal-placeholders.mjs fails CI and the gh-pages
 * prepare step if any "[" placeholder appears in these strings.
 *
 * Inline syntax: **bold**, bare https:// URLs and e-mail addresses become
 * links. No other markup.
 */
export type LegalBlock =
  | { h2: string; id?: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { lines: string[] };

export type LegalPage = { title: string; description: string; blocks: LegalBlock[] };

export const datenschutzDe: LegalPage = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung für die Seite Live in Bonn und die Interessenbekundung für den TeslaTobi-Stammtisch in Bonn über Google Forms.",
  blocks: [
    { p: "Stand: 1. November 2026" },

    { h2: "1. Geltungsbereich und Verantwortlicher", id: "verantwortlicher" },
    {
      p: "Diese Datenschutzerklärung gilt für die Seite techtalktobi.com/de/live-in-bonn, diese Datenschutzerklärung und die Interessenbekundung für den TeslaTobi-Stammtisch in Bonn. Verantwortlich im Sinne von Art. 4 Nr. 7 Datenschutz-Grundverordnung (DSGVO) ist:",
    },
    { lines: ["Tobias Goebel", "E-Mail: tobias@techtalktobi.com"] },
    { p: "Einen Datenschutzbeauftragten haben wir nicht benannt, da hierzu keine Pflicht besteht." },

    { h2: "2. Überblick", id: "ueberblick" },
    {
      p: "Wir verarbeiten personenbezogene Daten nur, soweit dies für eine funktionsfähige Website, die Organisation des TeslaTobi-Stammtischs oder die Beantwortung deiner Anfragen erforderlich ist oder du eingewilligt hast. Die Verarbeitung richtet sich nach der DSGVO und, für den Zugriff auf dein Endgerät, nach § 25 Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz (TDDDG).",
    },
    { h3: "Empfänger" },
    { p: "Deine Daten erhalten nur diese Empfänger:" },
    {
      ul: [
        "GitHub, Inc., USA: Hosting dieser Website (siehe Abschnitt 3).",
        "Google LLC, USA: Formular zur Interessenbekundung (Google Forms), erst nach deinem Klick; die Übermittlung stützt sich auf das EU-US Data Privacy Framework (siehe Abschnitt 4).",
        "Porkbun LLC, Tigard, Oregon, USA: unser E-Mail-Postfach tobias@techtalktobi.com, wenn du uns schreibst oder dein Interesse per E-Mail bekundest (siehe Abschnitt 5).",
      ],
    },

    { h2: "3. Hosting über GitHub Pages", id: "hosting" },
    {
      p: "Diese Website wird bei GitHub Pages gehostet. Anbieter ist GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA, ein Tochterunternehmen der Microsoft Corporation.",
    },
    {
      p: "Beim Aufruf der Website verarbeitet GitHub technisch notwendige Daten, insbesondere deine IP-Adresse, Datum und Uhrzeit des Zugriffs, die aufgerufene Seite, Browsertyp und Betriebssystem. GitHub protokolliert die IP-Adressen von Besuchern nach eigenen Angaben aus Sicherheitsgründen. Wir selbst erhalten diese Protokolle nicht.",
    },
    {
      p: "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren und zuverlässigen Bereitstellung der Website.",
    },
    {
      p: "GitHub, Inc. ist unter dem EU-US Data Privacy Framework zertifiziert. Die Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss der Europäischen Kommission vom 10.07.2023 (Art. 45 DSGVO). Weitere Informationen: https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement",
    },

    { h2: "4. Interessenbekundung für den TeslaTobi-Stammtisch Bonn über Google Forms", id: "anmeldung" },
    { h3: "Laden des Formulars" },
    {
      p: 'Das Formular zur Interessenbekundung ist ein Formular von Google Forms, einem Dienst der Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Es wird erst geladen, wenn du auf "Formular von Google laden" klickst. Vorher werden keine Daten an Google übertragen. Nach dem Klick lädt dein Browser Inhalte von Servern von Google (u. a. docs.google.com, www.gstatic.com, ssl.gstatic.com, fonts.googleapis.com, fonts.gstatic.com und play.google.com). Google erhält dabei deine IP-Adresse, Browser- und Gerätedaten und die Adresse unserer Seite und kann Cookies und ähnliche Techniken auf deinem Gerät speichern oder auslesen (Übersicht: https://policies.google.com/technologies/cookies). Rechtsgrundlage ist deine Einwilligung durch den Klick (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit für die Zukunft widerrufen, indem du die Seite schließt und die Google-Cookies in deinem Browser löschst. Unsere Website selbst speichert deine Entscheidung nicht.',
    },
    { h3: "Zwecke und Daten" },
    {
      p: "Wir nutzen deine Angaben, um den Stammtisch zu planen und durchzuführen und dich dazu zu kontaktieren (Bestätigung, Änderung, Absage). Das Formular fragt ab:",
    },
    {
      ul: [
        "**Pflicht:** Vorname, Nachname, E-Mail-Adresse, Bundesland, mindestens ein möglicher Termin (\"Mögliche Termine für mich\", Mehrfachauswahl), Bestätigung, dass du mindestens 18 Jahre alt bist, und deine Einwilligung in die Verarbeitung deiner Angaben durch Google (USA).",
        "**Freiwillig:** Landkreis bzw. kreisfreie Stadt, was du beitragen möchtest (z. B. Fotos/Video vor Ort, Kontakte zu einer Location, Printshops), ob du mit einem Tesla kommst und gegebenenfalls das Modell (z. B. 2025 Model Y Performance).",
      ],
    },
    {
      p: "Freiwillige Angaben helfen uns bei der Planung (z. B. um einzuschätzen, aus welchen Regionen Gäste anreisen), sind aber für die Teilnahme nicht nötig. Bitte gib keine Gesundheitsdaten oder anderen sensiblen Angaben an.",
    },
    { h3: "Rechtsgrundlagen" },
    {
      p: 'Organisation deiner Teilnahme: Art. 6 Abs. 1 lit. b DSGVO, ergänzend Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Organisation einer Community-Veranstaltung), weil die Teilnahme kostenlos ist. Speicherung deiner Antworten bei Google: deine Einwilligung im Formular ("Ich habe die Datenschutzhinweise gelesen und willige in die Verarbeitung meiner Angaben durch Google (USA) ein.", Art. 6 Abs. 1 lit. a DSGVO). Freiwillige Angaben: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Jede Einwilligung ist freiwillig und kann jederzeit per E-Mail an tobias@techtalktobi.com für die Zukunft widerrufen werden.',
    },
    { h3: "Empfänger" },
    {
      p: "Google LLC (USA) speichert deine Antworten in Google Forms und in einer Google-Tabelle (Google Sheets) in unserem Google-Konto. Für dieses Konto besteht mit Google **kein** Vertrag zur Auftragsverarbeitung. Google verarbeitet die Daten daher nach eigenen Bedingungen und seiner Datenschutzerklärung (https://policies.google.com/privacy), zum Teil auch für eigene Zwecke wie Sicherheit und Verbesserung der Dienste. Nur wir haben Zugriff auf die Antworten; wir geben sie nicht an Sponsoren oder zu Werbezwecken weiter.",
    },
    { h3: "Übermittlung in die USA" },
    {
      p: "Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert (https://www.dataprivacyframework.gov/participant/5780, Stand 31.10.2026). Die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023 (Art. 45 DSGVO). Wir selbst sitzen ebenfalls in den USA.",
    },
    { h3: "Speicherdauer und Löschung" },
    {
      p: "Wir schließen das Formular zum Einsendeschluss. Spätestens 30 Tage nach dem Stammtisch löschen wir alle Antworten in Google Forms, die Google-Tabelle als ganze Datei samt Versionsverlauf und Papierkorb, Downloads und E-Mails mit deinen Angaben. Wenn du widerrufst oder dich abmeldest, löschen wir deine Angaben früher. Wie lange Google gelöschte Daten noch in Sicherungskopien hält, bestimmt Google.",
    },

    { h2: "5. Interesse und Kontakt per E-Mail", id: "kontakt" },
    {
      p: "Du kannst dein Interesse ohne Nachteil auch per E-Mail an tobias@techtalktobi.com bekunden oder uns so kontaktieren. Wir verarbeiten dann deine Angaben (E-Mail-Adresse, Name falls angegeben, Inhalt der Nachricht), um deine Interessenbekundung oder Anfrage zu bearbeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und f DSGVO. Unser E-Mail-Postfach tobias@techtalktobi.com liegt bei Porkbun LLC, Tigard, Oregon, USA. Porkbun erhält dabei deine E-Mail und speichert sie für uns. E-Mails zur Interessenbekundung löschen wir spätestens 30 Tage nach dem Stammtisch, andere Anfragen, sobald sie erledigt sind.",
    },

    { h2: "6. Keine Webanalyse, keine externen Schriftarten", id: "keine-analyse" },
    {
      p: "Auf den Seiten zum Stammtisch (techtalktobi.com/de/live-in-bonn und diese Datenschutzerklärung) setzen wir keine Analyse- oder Tracking-Werkzeuge ein. Die Schriftart wird mit der Seite selbst ausgeliefert; es werden dabei keine Daten an Google oder andere Schriftanbieter übertragen.",
    },

    { h2: "7. Cookies und Zugriffe auf dein Endgerät", id: "cookies" },
    {
      p: 'Die Seiten zum Stammtisch setzen keine Cookies und greifen nicht auf Informationen in deinem Endgerät zu, die nicht für die Darstellung der Seite unbedingt erforderlich sind (§ 25 Abs. 2 Nr. 2 TDDDG). Ein Cookie-Banner ist deshalb nicht nötig. Das Formular von Google lädt erst nach deinem Klick auf "Formular von Google laden". Erst dann kann Google (nicht wir) Cookies auf deinem Gerät speichern oder lesen, siehe Abschnitt 4.',
    },

    { h2: "8. Externe Links", id: "links" },
    {
      p: "Diese Seiten enthalten Links zu anderen Websites. Erst wenn du einen Link anklickst, gelangst du auf die Seite des jeweiligen Anbieters, der dann für die Datenverarbeitung verantwortlich ist.",
    },

    { h2: "9. Deine Rechte", id: "rechte" },
    { p: "Du hast das Recht auf" },
    {
      ul: [
        "Auskunft (Art. 15 DSGVO),",
        "Berichtigung (Art. 16 DSGVO),",
        "Löschung (Art. 17 DSGVO),",
        "Einschränkung der Verarbeitung (Art. 18 DSGVO),",
        "Datenübertragbarkeit (Art. 20 DSGVO),",
        "Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aus Gründen, die sich aus deiner besonderen Situation ergeben (Art. 21 DSGVO),",
        "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).",
      ],
    },
    { p: "Eine E-Mail an tobias@techtalktobi.com genügt." },
    {
      p: "**Beschwerderecht:** Du kannst dich bei jeder Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem Mitgliedstaat deines Aufenthaltsorts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes (Art. 77 DSGVO). Für den Veranstaltungsort Bonn ist dies zum Beispiel: Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße 2-4, 40213 Düsseldorf, https://www.ldi.nrw.de",
    },

    { h2: "10. Keine automatisierte Entscheidungsfindung", id: "automatisiert" },
    {
      p: "Wir treffen keine ausschließlich automatisierten Entscheidungen einschließlich Profiling im Sinne von Art. 22 DSGVO.",
    },

    { h2: "11. Pflicht zur Bereitstellung", id: "pflicht" },
    {
      p: "Du bist nicht verpflichtet, uns Daten bereitzustellen. Ohne E-Mail-Adresse können wir dein Interesse jedoch nicht berücksichtigen; im Google-Formular sind außerdem dein Vorname, dein Nachname, dein Bundesland, mindestens ein möglicher Termin, die Bestätigung, dass du mindestens 18 Jahre alt bist, und die Einwilligung zu Google nötig.",
    },

    { h2: "12. Änderungen", id: "aenderungen" },
    {
      p: "Wir passen diese Datenschutzerklärung an, wenn sich die Seite, das Formular oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.",
    },
  ],
};

export const legalPagesDe = { datenschutz: datenschutzDe };
