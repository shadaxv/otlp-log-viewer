export function Chevron({
  expanded = false,
  className = "",
}: {
  expanded?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`size-4 shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""} ${className}`}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="m6 3.5 4.5 4.5L6 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
