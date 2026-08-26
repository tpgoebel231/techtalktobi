export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="6" className="fill-bg" />
      <path
        className="fill-accent"
        d="M6 6h20v4H22v8h-4V10h-4v8h-4V10H6V6z"
      />
      <rect x="6" y="21" width="20" height="2" className="fill-accent" />
      <path className="fill-accent" d="M16 21l8 7H8z" />
      <path className="fill-bg" d="M16 23.2l5.2 4.8H10.8z" />
    </svg>
  );
}
