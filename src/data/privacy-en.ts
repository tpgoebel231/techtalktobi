/**
 * English Privacy Policy for Google OAuth / YouTube Data API access,
 * plus website analytics and consent. Live at /privacy and /en/privacy.
 * /de/privacy uses privacyDe. Contact email matches links.email in src/data/media.ts.
 */
export type PrivacyBlock =
  | { h2: string }
  | { p: string }
  | { ul: string[] };

export type PrivacyPage = {
  title: string;
  description: string;
  blocks: PrivacyBlock[];
};

export const privacyEn: PrivacyPage = {
  title: "Privacy Policy",
  description:
    "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.",
  blocks: [
    { p: "Last updated: November 9, 2026" },

    { h2: "Who operates this" },
    {
      p: "The TechTalkTobi website (techtalktobi.com) and its Google API client are operated by Tobias Goebel.",
    },

    { h2: "Google and YouTube API access" },
    {
      p: "YouTube Data API v3 access (scopes youtube.upload, youtube, and youtube.force-ssl) is used only by Tobias himself to upload and manage videos on his own YouTube channels TeslaTobi and TechTalk-Tobi.",
    },
    {
      p: "No data from other users is collected, stored, sold, or shared through this access.",
    },
    {
      p: "OAuth tokens are kept privately on his own computers and are never shared.",
    },

    { h2: "Google and YouTube policies" },
    {
      p: "Use of Google and YouTube APIs is also subject to the Google Privacy Policy (https://policies.google.com/privacy) and the YouTube Terms of Service (https://www.youtube.com/t/terms).",
    },

    { h2: "Website analytics and consent" },
    {
      p: "I use Google Analytics 4 to see how this website is used: which pages get visited, how visitors arrive (for example from a search engine or a link), and roughly what device, browser, and region they come from. That tells me what is worth writing more of. I do not use it to identify you, and it has nothing to do with the YouTube API access described above.",
    },
    {
      p: "Google Analytics only runs after you click Accept in the consent banner. Until then, nothing from Google Analytics is loaded and no analytics cookies are set. If you decline, it stays that way. Your choice is stored in your own browser (localStorage) so the banner does not ask again on every page.",
    },
    {
      p: "You can change your mind at any time: click Cookie settings in the footer of any page and withdraw or give your consent.",
    },
    {
      p: "If you accept, the usage data goes to Google (Google Ireland Limited, with processing by Google LLC in the USA). Google's handling of this data is described in the Google Privacy Policy (https://policies.google.com/privacy).",
    },
    {
      p: "Fonts on this site are hosted on this site's own server, so loading a page sends no requests to Google Fonts.",
    },
    {
      p: "The German Live in Bonn pages have their own Datenschutzerklärung at https://techtalktobi.com/de/datenschutz.",
    },

    { h2: "Contact" },
    {
      p: "Questions about this policy: info@techtalktobi.com.",
    },
  ],
};
