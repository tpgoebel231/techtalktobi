/**
 * English Privacy Policy for Google OAuth / YouTube Data API access.
 * Live at /privacy and /en/privacy (and /de/privacy with the same English text).
 * Contact email matches links.email in src/data/media.ts (About + footer).
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

    { h2: "Website analytics" },
    {
      p: "Website analytics (Google Analytics) on the main TechTalkTobi pages are separate from the YouTube API access described here. For the German Live in Bonn pages, see the Datenschutzerklärung at https://techtalktobi.com/de/datenschutz.",
    },

    { h2: "Contact" },
    {
      p: "Questions about this policy: info@techtalktobi.com.",
    },
  ],
};
