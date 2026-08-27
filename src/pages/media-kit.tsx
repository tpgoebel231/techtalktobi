import { Printer } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { channels, links } from "@/data/media";
import { useCopy, useLocale } from "@/lib/i18n";

export function MediaKitPage() {
  const locale = useLocale();
  const copy = useCopy();

  const short =
    locale === "de"
      ? "Tobias P. Goebel ist Technologe und Medienproduzent in Boston. Online: tpgoebel. Er dokumentiert Tesla Full Self-Driving auf TeslaTobi (DE) und ordnet Autonomie, KI und Robotik auf TechTalkTobi (EN) ein. Fan der Technik, kein Fanboy."
      : "Tobias P. Goebel is a Boston-based technologist and media producer. Online: tpgoebel. He documents Tesla Full Self-Driving on TeslaTobi (DE) and covers autonomy, AI, and robotics on TechTalkTobi (EN). A fan of the technology, not a fanboy.";

  const long =
    locale === "de"
      ? "Tobias P. Goebel — Tobi — ist in Deutschland aufgewachsen und lebt in Boston. Zwei Jahrzehnte Enterprise-Software (Forschung, Produkt, Sales Engineering, technisches Produktmarketing). Seit Jahren fährt er Tesla FSD Supervised im US-Alltag und veröffentlicht die Befunde. TeslaTobi ist der deutsche Kommentar-Kanal; TechTalkTobi der englische; techtalktobi.com die öffentliche Forschungsseite. Online überall: tpgoebel. Sein Thema: die Lücke zwischen US-Technikrealität und europäischer Regulierung (StVG, UNECE, EU)."
      : "Tobias P. Goebel — Tobi — grew up in Germany and lives in Boston. Two decades in enterprise software spanning R&D, product, sales engineering, and technical product marketing. For years he has driven Tesla FSD Supervised as a US daily driver and published what he finds. TeslaTobi is the German commentary channel; TechTalkTobi the English one; techtalktobi.com the public research site. Online everywhere: tpgoebel. The beat is the gap between US technical reality and European regulation (StVG, UNECE, EU).";

  const topics =
    locale === "de"
      ? [
          "FSD Supervised im US-Alltag — was die Software tut, wo sie scheitert",
          "SAE-Stufen gegen Marketingsprache",
          "Robotaxi-Stacks im Vergleich (Tesla, Waymo, andere)",
          "Humanoide: Technik-Stack, Betriebsstunden, Sicherheitsnachweis",
          "Regulierung DE / EU / UNECE vs. US-Praxis",
        ]
      : [
          "FSD Supervised as a US daily driver — what the software does, where it fails",
          "SAE levels versus marketing language",
          "Robotaxi stacks compared (Tesla, Waymo, others)",
          "Humanoids: stack, hours, safety case",
          "German / EU / UNECE rules versus US practice",
        ];

  return (
    <Container className="py-14 sm:py-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-accent uppercase">
            {copy.mediaKit.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl text-fg sm:text-6xl">
            {copy.mediaKit.title}
          </h1>
          <p className="mt-4 max-w-xl text-muted">{copy.mediaKit.dek}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          {copy.mediaKit.print}
        </Button>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <img
          src="/images/tobias.jpg"
          alt={copy.brand.name}
          className="w-full max-w-xs rounded-xl object-cover lg:col-span-4"
        />
        <div className="lg:col-span-8">
          <h2 className="text-sm font-medium tracking-wide text-muted uppercase">
            {copy.mediaKit.shortBio}
          </h2>
          <p className="mt-2 max-w-2xl text-fg">{short}</p>
          <h2 className="mt-8 text-sm font-medium tracking-wide text-muted uppercase">
            {copy.mediaKit.longBio}
          </h2>
          <p className="mt-2 max-w-2xl text-fg">{long}</p>
        </div>
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl text-fg">{copy.mediaKit.topics}</h2>
          <ul className="mt-4 space-y-3">
            {topics.map((item) => (
              <li key={item} className="border-l-2 border-accent pl-4 text-sm text-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl text-fg">{copy.mediaKit.channels}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={channels.teslatobi.url} className="text-accent" target="_blank" rel="noreferrer">
                {channels.teslatobi.handle}
              </a>
              <span className="text-muted"> — TeslaTobi (DE)</span>
            </li>
            <li>
              <a href={channels.techtalktobi.url} className="text-accent" target="_blank" rel="noreferrer">
                {channels.techtalktobi.handle}
              </a>
              <span className="text-muted"> — TechTalkTobi (EN)</span>
            </li>
            <li>
              <a href={links.x} className="text-accent" target="_blank" rel="noreferrer">
                @tpgoebel
              </a>
              <span className="text-muted"> — X</span>
            </li>
            <li>
              <a href={`mailto:${links.email}`} className="text-accent">
                {links.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-14 border-t border-border pt-8">
        <h2 className="font-display text-2xl text-fg">{copy.mediaKit.usage}</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{copy.mediaKit.usageBody}</p>
      </div>
    </Container>
  );
}
