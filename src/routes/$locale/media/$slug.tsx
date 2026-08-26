import { createFileRoute, notFound } from "@tanstack/react-router";
import { getReport } from "@/data/media";
import { ReportDetailPage } from "@/pages/report-detail";

export const Route = createFileRoute("/$locale/media/$slug")({
  beforeLoad: ({ params }) => {
    if (!getReport(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const report = getReport(params.slug);
    const title =
      params.locale === "de" ? report?.title.de : report?.title.en;
    return {
      meta: [{ title: `${title ?? "Report"} · TechTalkTobi` }],
    };
  },
  component: ReportDetailRoute,
});

function ReportDetailRoute() {
  const { slug } = Route.useParams();
  if (!getReport(slug)) throw notFound();
  return <ReportDetailPage slug={slug} />;
}
