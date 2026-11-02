import type { ReactNode } from "react";
import { BonnShell } from "@/components/bonn-shell";
import type { LegalBlock, LegalPage } from "@/data/legal-de";

const TOKEN = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+[^\s).,;]|[\w.+-]+@[\w-]+\.[\w.]+\w)/g;

/** **bold**, bare URLs and e-mail addresses. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("http"))
      out.push(
        <a key={key} href={tok} rel="noreferrer">
          {tok}
        </a>,
      );
    else out.push(<a key={key} href={`mailto:${tok}`}>{tok}</a>);
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Highlights outermost [PLACEHOLDER] spans so open items are obvious. */
function render(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let depth = 0;
  let start = 0;
  let buf = "";
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "[") {
      if (depth === 0) {
        if (buf) out.push(...inline(buf, `${keyBase}-t${n++}`));
        buf = "";
        start = i;
      }
      depth++;
    } else if (c === "]" && depth > 0) {
      depth--;
      if (depth === 0) {
        out.push(
          <mark key={`${keyBase}-m${n++}`} className="ph">
            {text.slice(start, i + 1)}
          </mark>,
        );
      }
    } else if (depth === 0) {
      buf += c;
    }
  }
  if (depth > 0) buf += text.slice(start);
  if (buf) out.push(...inline(buf, `${keyBase}-t${n++}`));
  return out;
}

function Block({ block, k }: { block: LegalBlock; k: string }) {
  if ("h2" in block) return <h2 id={block.id}>{render(block.h2, k)}</h2>;
  if ("h3" in block) return <h3>{render(block.h3, k)}</h3>;
  if ("ul" in block)
    return (
      <ul>
        {block.ul.map((li, i) => (
          <li key={i}>{render(li, `${k}-${i}`)}</li>
        ))}
      </ul>
    );
  if ("lines" in block)
    return (
      <address>
        {block.lines.map((line, i) => (
          <span key={i}>
            {render(line, `${k}-${i}`)}
            <br />
          </span>
        ))}
      </address>
    );
  return <p>{render(block.p, k)}</p>;
}

export function LegalPageDe({ page }: { page: LegalPage }) {
  return (
    <BonnShell>
      <div className="wrap legal">
        <h1>{page.title}</h1>
        {page.blocks.map((b, i) => (
          <Block key={i} block={b} k={`b${i}`} />
        ))}
      </div>
    </BonnShell>
  );
}
