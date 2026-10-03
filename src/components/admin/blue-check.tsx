export function BlueCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Verified">
      <circle cx="12" cy="12" r="10" fill="var(--accent)" />
      <polyline
        points="8 12 11 15 16 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}