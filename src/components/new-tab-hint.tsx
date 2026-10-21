import { useCopy } from "@/lib/i18n";

/** Props + visually hidden hint for arrow-style links that open in a new tab. */
export const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;

export function NewTabHint() {
  const copy = useCopy();
  return <span className="sr-only"> {copy.newTab}</span>;
}
