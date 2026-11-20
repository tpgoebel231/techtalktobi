import { cn } from "@/lib/utils";

export function Mark({ className, alt = "" }: { className?: string; alt?: string }) {
  return (
    <img
      src="/logo-128.png"
      alt={alt}
      width={128}
      height={128}
      className={cn("mark object-contain", className)}
    />
  );
}
