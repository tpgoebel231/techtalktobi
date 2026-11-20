import { Container } from "@/components/container";
import { impressum, type ImpressumBlock } from "@/data/impressum";
import { useLocale } from "@/lib/i18n";

function Block({ block }: { block: ImpressumBlock }) {
  if ("h2" in block) {
    return <h2 className="mt-10 font-display text-2xl text-fg">{block.h2}</h2>;
  }
  if ("address" in block) {
    return (
      <address className="mt-3 text-base leading-relaxed text-fg/90 not-italic">
        {block.address.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    );
  }
  if ("contact" in block) {
    const { emailLabel, email, formHref, formLabel } = block.contact;
    return (
      <p className="mt-3 text-base leading-relaxed text-fg/90">
        {emailLabel}:{" "}
        <a href={`mailto:${email}`} className="text-accent underline-offset-2 hover:underline">
          {email}
        </a>
        <br />
        <a href={formHref} className="text-accent underline-offset-2 hover:underline">
          {formLabel}
        </a>
      </p>
    );
  }
  return <p className="mt-3 text-base leading-relaxed text-fg/90">{block.p}</p>;
}

export function ImpressumPage() {
  const page = impressum[useLocale()];
  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <h1 className="font-display text-4xl leading-tight text-fg sm:text-5xl">{page.title}</h1>
      {page.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </Container>
  );
}
