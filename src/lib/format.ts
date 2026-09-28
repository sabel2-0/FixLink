export function esc(s: unknown): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  )
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return s + "s ago"
  if (s < 3600) return Math.floor(s / 60) + "m ago"
  if (s < 86400) return Math.floor(s / 3600) + "h ago"
  return Math.floor(s / 86400) + "d ago"
}

export function peso(n: number | null | undefined): string {
  if (n == null) return "—"
  return "₱" + Number(n).toLocaleString()
}

export const STATUS_BADGE: Record<string, string> = {
  Active: "badge-active",
  Confirmed: "badge-active",
  Estimated: "badge-info",
  EnRoute: "badge-info",
  Arrived: "badge-info",
  InProgress: "badge-warn",
  QuotePending: "badge-warn",
  Pending: "badge-pending",
  Suspended: "badge-suspended",
  Completed: "badge-completed",
  Cancelled: "badge-cancelled",
  Unmatched: "badge-suspended",
  NoShow: "badge-suspended",
  Disputed: "badge-suspended",
  Open: "badge-warn",
  Resolved: "badge-active",
  Owed: "badge-pending",
  Paid: "badge-active",
  Verified: "badge-active",
  Unverified: "badge-suspended",
}

export function badgeClass(s: string): string {
  return STATUS_BADGE[s] || "badge-completed"
}
