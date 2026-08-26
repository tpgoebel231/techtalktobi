import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/container";
import { getReport } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function ReportDetailPage({ slug }: { slug: string }) {
  const locale = useLocale();
  const copy = useCopy();
  const report = getReport(slug)!;

  return (
    <article>
      <Container className="py-10 sm:py-16">
        <Link
          to="/$locale/media"
          params={{ locale }}
          className="inline-flex h-11 items-center gap-2 text-sm text-muted no-underline hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {copy.nav.media}
        </Link>
        <p className="mt-8 font-mono text-xs text-faint">{report.date}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-fg sm:text-6xl">
          {report.title[locale]}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{report.dek[locale]}</p>
      </Container>
      <img
        src={report.image}
        alt=""
        className="max-h-[420px] w-full object-cover"
      />
      <Container className="max-w-3xl py-12 sm:py-16">
        <div className="flex flex-col gap-6">
          {report.body.map((p) => (
            <p key={p.en} className="text-base leading-relaxed text-fg">
              {p[locale]}
            </p>
          ))}
        </div>
      </Container>
    </article>
  );
}
