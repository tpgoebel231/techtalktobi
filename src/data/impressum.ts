import type { Locale } from "@/lib/locale";

export type ImpressumBlock =
  | { h2: string }
  | { p: string }
  | { address: string[] }
  | { contact: { emailLabel: string; email: string; formHref: string; formLabel: string } };

export type ImpressumPage = {
  title: string;
  description: string;
  blocks: ImpressumBlock[];
};

/** Adapted from the Stammtisch legal drafts, without event-specific lines. */
export const impressum: Record<Locale, ImpressumPage> = {
  de: {
    title: "Impressum",
    description:
      "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG) für techtalktobi.com.",
    blocks: [
      { h2: "Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)" },
      {
        address: [
          "Tobias Goebel",
          "30 Fuller St, Apt 303",
          "Brookline, MA 02446",
          "USA",
        ],
      },
      { h2: "Kontakt" },
      {
        contact: {
          emailLabel: "E-Mail",
          email: "tobias@techtalktobi.com",
          formHref: "/de/about#contact",
          formLabel: "Weitere Kontaktmöglichkeiten",
        },
      },
      { h2: "Verantwortlich für den Inhalt nach § 18 Abs. 2 Medienstaatsvertrag (MStV)" },
      { p: "Tobias Goebel, Anschrift wie oben." },
      { h2: "Haftung für Links" },
      {
        p: "Diese Website enthält Links zu externen Websites Dritter. Auf deren Inhalte haben wir keinen Einfluss. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.",
      },
    ],
  },
  en: {
    title: "Legal notice",
    description:
      "Information pursuant to § 5 of the German Digital Services Act (DDG) for techtalktobi.com.",
    blocks: [
      { h2: "Information pursuant to § 5 of the German Digital Services Act (DDG)" },
      {
        address: [
          "Tobias Goebel",
          "30 Fuller St, Apt 303",
          "Brookline, MA 02446",
          "USA",
        ],
      },
      { h2: "Contact" },
      {
        contact: {
          emailLabel: "Email",
          email: "tobias@techtalktobi.com",
          formHref: "/en/about#contact",
          formLabel: "More ways to reach me",
        },
      },
      {
        h2: "Responsible for content pursuant to § 18(2) of the German Interstate Media Treaty (MStV)",
      },
      { p: "Tobias Goebel, address as above." },
      { h2: "Liability for links" },
      {
        p: "This site links to third-party websites. We have no control over their content; the respective provider is responsible. We remove links promptly once we learn of any infringement.",
      },
    ],
  },
};
