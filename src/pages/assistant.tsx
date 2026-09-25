import { Container } from "@/components/container";
import { HelgaCall } from "@/components/helga-call";
import { useCopy } from "@/lib/i18n";

export function AssistantPage() {
  const copy = useCopy().helga;

  return (
    <Container className="py-14 sm:py-20">
      <p className="font-mono text-[11px] tracking-widest text-accent uppercase">{copy.eyebrow}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-fg sm:text-6xl">{copy.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{copy.dek}</p>
      <div className="mt-8 max-w-xl">
        <HelgaCall variant="panel" />
      </div>
    </Container>
  );
}
