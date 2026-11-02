/**
 * German legal pages (/de/impressum, /de/datenschutz), from the Corporate
 * Lawyer drafts in /workspace/legal/stammtisch-bonn/ (impressum-de.md and
 * datenschutz-de.md, Option D: Google Forms embedded with two-click, text
 * block (iv) from formular-langfristig.md).
 *
 * Anything in [SQUARE BRACKETS] is a placeholder only Tobias can fill or an
 * open option he has to pick. Replace the whole bracket with the final text,
 * or delete the block for an option he did not pick. Do not invent values.
 *
 * GUARD: scripts/check-legal-placeholders.mjs fails CI and the gh-pages
 * prepare step while any "[" remains in these strings.
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

export const impressumDe: LegalPage = {
  title: "Impressum",
  description: "Impressum von techtalktobi.com, Angaben gemäß § 5 DDG.",
  blocks: [
    { h2: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)" },
    {
      lines: [
        "[VOLLER NAME, z. B. Vorname Nachname]",
        '[OPTIONAL: Kanal- oder Markenname, z. B. "TeslaTobi / TechTalk-Tobi"]',
        "[STRASSE UND HAUSNUMMER]",
        "[ORT, BUNDESSTAAT, ZIP CODE]",
        "USA",
      ],
    },
    { h2: "Kontakt" },
    {
      lines: [
        "E-Mail: tobias@techtalktobi.com",
        "[OPTION A (empfohlen): Kontaktformular: [LINK ZUM KONTAKTFORMULAR]. Wir antworten in der Regel innerhalb von [2] Werktagen.]",
        "[OPTION B: Telefon: [TELEFON, mit Ländervorwahl +1 ...]]",
      ],
    },
    { h2: "Umsatzsteuer-Identifikationsnummer" },
    {
      p: "[NUR WENN VORHANDEN: USt-IdNr. gemäß § 27a UStG: DE... SONST DIESEN ABSCHNITT WEGLASSEN. Keine US-EIN oder SSN eintragen.]",
    },
    { h2: "Verantwortlich für den Inhalt nach § 18 Abs. 2 Medienstaatsvertrag (MStV)" },
    { p: "[NUR FALLS ERFORDERLICH (Entscheidung Tobias und Anwalt): NAME, ANSCHRIFT. SONST ABSCHNITT WEGLASSEN.]" },
    { h2: "Veranstalter des TeslaTobi-Stammtischs in Bonn" },
    {
      p: "Veranstalter ist [VOLLER NAME] (Anschrift wie oben). [OPTION: Ansprechperson vor Ort am Veranstaltungstag: [NAME VOR ORT], erreichbar über [E-MAIL/TELEFON].]",
    },
    { h2: "Verbraucherstreitbeilegung" },
    {
      p: '[OPTION A (empfohlen): Abschnitt ganz weglassen. OPTION B: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."]',
    },
    { h2: "Haftung für Links" },
    {
      p: "Diese Website enthält Links zu externen Websites Dritter. Auf deren Inhalte haben wir keinen Einfluss. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.",
    },
  ],
};

export const datenschutzDe: LegalPage = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung von techtalktobi.com, unter anderem zur Anmeldung zum TeslaTobi-Stammtisch in Bonn über Google Forms.",
  blocks: [
    { p: "Stand: [DATUM]" },

    { h2: "1. Verantwortlicher", id: "verantwortlicher" },
    {
      p: "Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne von Art. 4 Nr. 7 Datenschutz-Grundverordnung (DSGVO) ist:",
    },
    {
      lines: [
        "[VOLLER NAME]",
        "[STRASSE UND HAUSNUMMER]",
        "[ORT, BUNDESSTAAT, ZIP CODE], USA",
        "E-Mail: tobias@techtalktobi.com",
        "[NUR WENN IM IMPRESSUM OPTION B: Telefon: [TELEFON]]",
      ],
    },
    { p: "Einen Datenschutzbeauftragten haben wir nicht benannt, da hierzu keine Pflicht besteht." },
    { h3: "Vertreter in der Europäischen Union (Art. 27 DSGVO)" },
    {
      p: "[OPTION A: Unser Vertreter in der EU ist: [NAME/FIRMA DES VERTRETERS], [ANSCHRIFT IN DER EU], [E-MAIL]. Sie können sich mit allen Fragen zum Datenschutz auch an den Vertreter wenden.]",
    },
    {
      p: "[OPTION B: Einen Vertreter in der EU haben wir nicht benannt, weil wir nur gelegentlich und in geringem Umfang Daten verarbeiten, keine besonderen Kategorien personenbezogener Daten verarbeiten und kein Risiko für Sie erkennbar ist (Art. 27 Abs. 2 lit. a DSGVO). PRÜFEN Anwalt]",
    },

    { h2: "2. Überblick", id: "ueberblick" },
    {
      p: "Wir verarbeiten personenbezogene Daten nur, soweit dies für eine funktionsfähige Website, die Organisation des TeslaTobi-Stammtischs oder die Beantwortung Ihrer Anfragen erforderlich ist oder Sie eingewilligt haben. Die Verarbeitung richtet sich nach der DSGVO und, für den Zugriff auf Ihr Endgerät, nach § 25 Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz (TDDDG).",
    },

    { h2: "3. Hosting über GitHub Pages", id: "hosting" },
    {
      p: "Diese Website wird bei GitHub Pages gehostet. Anbieter ist GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA, ein Tochterunternehmen der Microsoft Corporation.",
    },
    {
      p: "Beim Aufruf der Website verarbeitet GitHub technisch notwendige Daten, insbesondere Ihre IP-Adresse, Datum und Uhrzeit des Zugriffs, die aufgerufene Seite, Browsertyp und Betriebssystem. GitHub protokolliert die IP-Adressen von Besuchern nach eigenen Angaben aus Sicherheitsgründen. Wir selbst erhalten diese Protokolle nicht.",
    },
    {
      p: "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren und zuverlässigen Bereitstellung der Website.",
    },
    {
      p: "GitHub, Inc. ist unter dem EU-US Data Privacy Framework zertifiziert. Die Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss der Europäischen Kommission vom 10.07.2023 (Art. 45 DSGVO). Weitere Informationen: https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement",
    },

    { h2: "4. Anmeldung zum TeslaTobi-Stammtisch Bonn über Google Forms", id: "anmeldung" },
    { h3: "Laden des Formulars" },
    {
      p: 'Das Anmeldeformular ist ein Formular von Google Forms, einem Dienst der Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Es wird erst geladen, wenn Sie auf "Formular von Google laden" klicken. Vorher werden keine Daten an Google übertragen. Nach dem Klick lädt Ihr Browser Inhalte von Servern von Google (u. a. docs.google.com, gstatic.com [PRÜFEN]). Google erhält dabei Ihre IP-Adresse, Browser- und Gerätedaten und die Adresse unserer Seite und kann Cookies und ähnliche Techniken auf Ihrem Gerät speichern oder auslesen (z. B. "NID", bei angemeldeten Google-Nutzern auch Anmelde-Cookies; Übersicht: https://policies.google.com/technologies/cookies). Rechtsgrundlage ist Ihre Einwilligung durch den Klick (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Sie können sie jederzeit für die Zukunft widerrufen, indem Sie die Seite schließen und die Google-Cookies in Ihrem Browser löschen. Unsere Website selbst speichert Ihre Entscheidung nicht.',
    },
    { h3: "Zwecke und Daten" },
    {
      p: "Wir nutzen Ihre Angaben, um den Stammtisch zu planen und durchzuführen und Sie dazu zu kontaktieren (Bestätigung, Änderung, Absage). Pflichtangaben: Vorname oder Spitzname, E-Mail-Adresse, Bestätigung, dass Sie mindestens 18 Jahre alt sind, Einwilligung zur Nutzung von Google Forms. Freiwillig: Landkreis bzw. kreisfreie Stadt (Planung der Anreise und künftiger Orte), [Tesla-Modell (ZWECK EINTRAGEN ODER FELD STREICHEN)], Nachricht an uns, Einwilligung zu Nahaufnahmen und Interviews. Bitte geben Sie keine Gesundheitsdaten oder anderen sensiblen Angaben an.",
    },
    { h3: "Rechtsgrundlagen" },
    {
      p: "Organisation Ihrer Teilnahme: Art. 6 Abs. 1 lit. b DSGVO, ergänzend Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Organisation einer Community-Veranstaltung), weil die Teilnahme kostenlos ist. Speicherung Ihrer Antworten bei Google: Ihre Einwilligung im Formular (Art. 6 Abs. 1 lit. a DSGVO). Freiwillige Angaben: Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Jede Einwilligung ist freiwillig und kann jederzeit per E-Mail an tobias@techtalktobi.com für die Zukunft widerrufen werden.",
    },
    { h3: "Empfänger" },
    {
      p: "Google LLC (USA) speichert Ihre Antworten in Google Forms und in einer Google-Tabelle (Google Sheets) in unserem Google-Konto. Für dieses Konto besteht mit Google **kein** Vertrag zur Auftragsverarbeitung. Google verarbeitet die Daten daher nach eigenen Bedingungen und seiner Datenschutzerklärung (https://policies.google.com/privacy), zum Teil auch für eigene Zwecke wie Sicherheit und Verbesserung der Dienste. Nur wir haben Zugriff auf die Antworten; wir geben sie nicht an Sponsoren oder zu Werbezwecken weiter. [NUR FALLS NÖTIG: Der Veranstaltungsort [NAME, ORT] erhält eine Liste nur mit Namen für den Einlass.]",
    },
    { h3: "Übermittlung in die USA" },
    {
      p: "Google LLC ist unter dem EU-US Data Privacy Framework zertifiziert (https://www.dataprivacyframework.gov/participant/5780, Stand 31.10.2026). Die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023 (Art. 45 DSGVO). Google gibt an, ergänzend EU-Standardvertragsklauseln zu nutzen. Eine Einwilligung nach Art. 49 DSGVO ist deshalb nicht erforderlich. Wir selbst sitzen ebenfalls in den USA.",
    },
    { h3: "Speicherdauer und Löschung" },
    {
      p: "Wir schließen das Formular zum Anmeldeschluss. Spätestens 30 Tage nach dem Stammtisch löschen wir alle Antworten in Google Forms, die Google-Tabelle als ganze Datei samt Versionsverlauf und Papierkorb, Downloads und E-Mails mit Ihren Anmeldedaten. Wenn Sie widerrufen oder sich abmelden, löschen wir Ihre Angaben früher. Wie lange Google gelöschte Daten noch in Sicherungskopien hält, bestimmt Google [PRÜFEN].",
    },
    { h3: "Anmeldung per E-Mail als Alternative" },
    {
      p: "Sie können sich ohne Nachteil auch per E-Mail an tobias@techtalktobi.com anmelden. Unser Postfach liegt bei Porkbun LLC, 11575 SW Pacific Hwy PMB 40649, Tigard, OR 97223, USA (Auftragsverarbeiter mit Vertrag nach Art. 28 DSGVO und EU-Standardvertragsklauseln; Server bei Amazon Web Services in den USA). Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO. Löschung: spätestens 30 Tage nach dem Stammtisch.",
    },
    { h3: "KI-Unterstützung bei E-Mails" },
    {
      p: 'Eingehende E-Mails lassen wir von einem KI-Assistenten vorsortieren und Antwortentwürfe vorbereiten: Grok Bot (xAI), Anbieter [ANYSPHERE, INC., 2261 MARKET STREET STE 86466, SAN FRANCISCO, CA 94114, USA / SPACEX SUPER INTELLIGENCE LLC, 800 W CESAR CHAVEZ ST., AUSTIN, TX 78701, USA] [PRÜFEN: Gesellschaft und Anschrift laut Tarif und Vertragsbedingungen]. Inhalt und Absender Ihrer E-Mail gehen dabei an Server des Anbieters und an von ihm eingesetzte KI-Modellanbieter in den USA. [OPTION A, mit Vertrag: Der Anbieter ist unser Auftragsverarbeiter nach Art. 28 DSGVO; für die USA gelten EU-Standardvertragsklauseln.] [OPTION B, ohne Vertrag (Stand 31.10.2026 für Einzeltarife): Mit dem Anbieter besteht kein Vertrag zur Auftragsverarbeitung; er verarbeitet die Daten nach seiner eigenen Datenschutzerklärung (https://cursor.com/privacy bzw. https://x.ai/legal/privacy-policy) und kann sie in begrenztem Umfang auch für eigene Zwecke nutzen, etwa für Sicherheit und Missbrauchserkennung.] Die Nutzung für KI-Training haben wir abgeschaltet [PRÜFEN Einstellung]. Die KI entscheidet nichts über Ihre Teilnahme und versendet keine E-Mails; jede Antwort prüfen und senden wir selbst. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (zügige, geordnete Bearbeitung). **Widerspruch:** Schreiben Sie "Bitte ohne KI" in Ihre E-Mail, dann bearbeiten wir sie nur selbst (Art. 21 DSGVO). Löschung beim Anbieter spätestens 30 Tage nach dem Stammtisch [PRÜFEN].',
    },

    { h2: "5. Kontakt per E-Mail", id: "kontakt" },
    {
      p: "Wenn Sie uns per E-Mail [NUR WENN IMPRESSUM OPTION A: oder über das Kontaktformular] kontaktieren, verarbeiten wir Ihre Angaben (E-Mail-Adresse, Name falls angegeben, Inhalt der Nachricht), um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage mit einem Vertrag oder dessen Anbahnung zusammenhängt, sonst Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung). Wir löschen die Daten, wenn die Anfrage erledigt ist und keine Aufbewahrungspflichten bestehen. Unser E-Mail-Anbieter ist Porkbun LLC, 11575 SW Pacific Hwy PMB 40649, Tigard, OR 97223, USA. Mit Porkbun besteht ein Vertrag zur Auftragsverarbeitung einschließlich EU-Standardvertragsklauseln (Art. 28, Art. 46 Abs. 2 lit. c DSGVO).",
    },

    { h2: "6. Keine Webanalyse, keine externen Schriftarten", id: "keine-analyse" },
    {
      p: "Wir setzen keine Analyse- oder Tracking-Werkzeuge ein. Schriftarten werden von unserem eigenen Server geladen; es werden dabei keine Daten an Google oder andere Schriftanbieter übertragen.",
    },
    {
      p: "[ENTSCHEIDUNG TOBIAS: Dieser Abschnitt stimmt bisher nur für /de/live-in-bonn, /de/impressum und /de/datenschutz. Die übrigen Seiten von techtalktobi.com laden noch Google Analytics 4 und Google Fonts. Entweder beides site-weit entfernen, oder diesen Abschnitt mit dem Anwalt anpassen. Danach diese Klammer löschen.]",
    },

    { h2: "7. YouTube-Videos", id: "youtube" },
    { p: "[OPTION A: Keine eingebetteten Videos, nur Links zu YouTube.]" },
    {
      p: "[OPTION B, Zwei-Klick-Lösung: Auf einigen Seiten binden wir Videos von YouTube ein (Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Die Videos werden erst geladen, wenn Sie auf das Vorschaubild klicken. Erst dann werden Daten (u. a. Ihre IP-Adresse) an YouTube übertragen und gegebenenfalls Cookies oder ähnliche Technologien eingesetzt. Wir nutzen den erweiterten Datenschutzmodus (youtube-nocookie.com). Rechtsgrundlage ist Ihre Einwilligung durch den Klick (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Datenschutzerklärung von Google: https://policies.google.com/privacy]",
    },

    { h2: "8. Externe Links", id: "links" },
    {
      p: "Diese Website enthält Links zu anderen Websites (z. B. YouTube, X, Instagram). Erst wenn Sie einen Link anklicken, gelangen Sie auf die Seite des jeweiligen Anbieters, der dann für die Datenverarbeitung verantwortlich ist.",
    },

    { h2: "9. Cookies und Zugriffe auf Ihr Endgerät", id: "cookies" },
    {
      p: 'Diese Website setzt keine Cookies und greift nicht auf Informationen in Ihrem Endgerät zu, die nicht für die Darstellung der Seite unbedingt erforderlich sind (§ 25 Abs. 2 Nr. 2 TDDDG). Ein Cookie-Banner ist deshalb nicht nötig. Das Anmeldeformular von Google lädt erst nach Ihrem Klick auf "Formular von Google laden". Erst dann kann Google (nicht wir) Cookies auf Ihrem Gerät speichern oder lesen, siehe Abschnitt 4. Unsere Website speichert Ihre Entscheidung nicht.',
    },

    { h2: "10. Fotos und Videos beim Stammtisch", id: "fotos" },
    {
      p: "Beim Stammtisch fotografieren und filmen wir für unseren YouTube-Kanal [KANALNAME] und unsere Social-Media-Kanäle [INSTAGRAM/X]. Es gibt keinen Livestream; Aufnahmen werden erst nach dem Schnitt veröffentlicht.",
    },
    {
      ul: [
        "Übersichtsaufnahmen, auf denen Sie als Teil der Gruppe zu sehen sind, beruhen auf unserem berechtigten Interesse an der Berichterstattung über unsere Veranstaltung (Art. 6 Abs. 1 lit. f DSGVO). Sie können jederzeit widersprechen (Art. 21 DSGVO).",
        "Nahaufnahmen und Interviews machen wir nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie bei der Anmeldung oder vor Ort erteilen und jederzeit mit Wirkung für die Zukunft widerrufen können. Die Teilnahme hängt nicht von der Einwilligung ab.",
        "Vor Ort zeigen Armbänder dem Filmteam, wer gefilmt werden möchte (grün) und wer nicht im Fokus stehen möchte (weiß). Es gibt einen Bereich ohne Kamera.",
        "Veröffentlichte Aufnahmen werden auf YouTube (Google) und [WEITERE PLATTFORMEN] gespeichert und sind weltweit abrufbar.",
        "Widerspruch oder Widerruf: eine E-Mail an tobias@techtalktobi.com genügt. Vor der Veröffentlichung schneiden wir Sie heraus; bereits veröffentlichte Videos bearbeiten oder entfernen wir in der Regel innerhalb von 72 Stunden.",
        "Einwilligungsnachweise bewahren wir auf, solange die Aufnahmen veröffentlicht sind.",
      ],
    },

    { h2: "11. Ihre Rechte", id: "rechte" },
    { p: "Sie haben das Recht auf" },
    {
      ul: [
        "Auskunft (Art. 15 DSGVO),",
        "Berichtigung (Art. 16 DSGVO),",
        "Löschung (Art. 17 DSGVO),",
        "Einschränkung der Verarbeitung (Art. 18 DSGVO),",
        "Datenübertragbarkeit (Art. 20 DSGVO),",
        "Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aus Gründen, die sich aus Ihrer besonderen Situation ergeben (Art. 21 DSGVO),",
        "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).",
      ],
    },
    { p: "Eine E-Mail an tobias@techtalktobi.com genügt." },
    {
      p: "**Beschwerderecht:** Sie können sich bei jeder Datenschutz-Aufsichtsbehörde beschweren, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes (Art. 77 DSGVO). Für den Veranstaltungsort Bonn ist dies zum Beispiel: Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße 2-4, 40213 Düsseldorf, https://www.ldi.nrw.de [ANSCHRIFT VOR VERÖFFENTLICHUNG AUF LDI-WEBSITE PRÜFEN].",
    },

    { h2: "12. Keine automatisierte Entscheidungsfindung", id: "automatisiert" },
    {
      p: "Wir treffen keine ausschließlich automatisierten Entscheidungen einschließlich Profiling im Sinne von Art. 22 DSGVO.",
    },

    { h2: "13. Pflicht zur Bereitstellung", id: "pflicht" },
    {
      p: "Sie sind nicht verpflichtet, uns Daten bereitzustellen. Ohne Name und E-Mail-Adresse ist eine Anmeldung zum Stammtisch jedoch nicht möglich.",
    },

    { h2: "14. Änderungen", id: "aenderungen" },
    {
      p: "Wir passen diese Datenschutzerklärung an, wenn sich die Website oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.",
    },
  ],
};

export const legalPagesDe = { impressum: impressumDe, datenschutz: datenschutzDe };
