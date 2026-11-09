import type { ReactNode } from "react";
import { Container } from "@/components/container";
import { privacyEn, type PrivacyBlock } from "@/data/privacy-en";

const TOKEN = /(https?:\/\/[^\s)]+[^\s).,;]|[\w.+-]+@[\w-]+\.[\w.]+\w)/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("http")) {
      out.push(
        <a key={key} href={tok} className="text-accent underline-offset-2 hover:underline" rel="noreferrer">
          {tok}
        </a>,
      );
    } else {
      out.push(
        <a key={key} href={`mailto:${tok}`} className="text-accent underline-offset-2 hover:underline">
          {tok}
        </a>,
      );
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Block({ block, k }: { block: PrivacyBlock; k: string }) {
  if ("h2" in block) {
    return <h2 className="mt-10 font-display text-2xl text-fg">{block.h2}</h2>;
  }
  if ("ul" in block) {
    return (
      <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-fg/90">
        {block.ul.map((li, i) => (
          <li key={i}>{inline(li, `${k}-${i}`)}</li>
        ))}
      </ul>
    );
  }
  return <p className="mt-3 text-base leading-relaxed text-fg/90">{inline(block.p, k)}</p>;
}

export function PrivacyPage() {
  const page = privacyEn;
  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <h1 className="font-display text-4xl leading-tight text-fg sm:text-5xl">{page.title}</h1>
      {page.blocks.map((b, i) => (
        <Block key={i} block={b} k={`b${i}`} />
      ))}
    </Container>
  );
}
