import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import {
  getResearch,
  isResearchPublished,
  isResearchSlug,
  researchPublishedLocales,
} from "@/data/research";
import { isLocale } from "@/lib/locale";
import { ResearchDetailPage } from "@/pages/research-detail";

export const Route = createFileRoute("/$locale/research/$slug")({
  beforeLoad: ({ params }) => {
    if (!isResearchSlug(params.slug)) throw notFound();
    const piece = getResearch(params.slug);
    if (!piece || !isLocale(params.locale)) throw notFound();
    if (!isResearchPublished(piece, params.locale)) {
      const only = researchPublishedLocales(piece);
      if (only.length === 1) {
        throw redirect({
          to: "/$locale/research/$slug",
          params: { locale: only[0], slug: params.slug },
        });
      }
      throw notFound();
    }
  },
  head: ({ params }) => {
    const piece = getResearch(params.slug);
    const locale = params.locale === "de" ? "de" : "en";
    const title = piece?.title[locale];
    const description = piece?.dek[locale];
    return {
      meta: [
        { title: `${title ?? "Research"} · TechTalkTobi` },
        ...(description ? [{ name: "description", content: description }] : []),
      ],
    };
  },
  component: ResearchDetailRoute,
});

function ResearchDetailRoute() {
  const { slug } = Route.useParams();
  if (!isResearchSlug(slug)) throw notFound();
  return <ResearchDetailPage slug={slug} />;
}
