import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/pages/privacy";

const TITLE = "Privacy Policy · TechTalkTobi";
const DESCRIPTION =
  "How Tobias Goebel uses Google and YouTube API access on TechTalkTobi to manage his own YouTube channels.";

export const Route = createFileRoute("/$locale/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
    ],
  }),
});
