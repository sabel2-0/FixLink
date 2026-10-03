export function Stars({ avg, size = 14 }: { avg: number; size?: number }) {
  const rounded = Math.round(avg)
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color: "var(--warn)",
        verticalAlign: "middle",
      }}
      aria-label={`${avg.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill={n <= rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block", opacity: n <= rounded ? 1 : 0.25 }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}