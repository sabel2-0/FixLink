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

// Arrival = scheduledTime + etaMinutes, shown as a clock time (e.g. "~10:59 AM").
// Falls back to "~N min" when no scheduled time is available.
export function formatEta(
  etaMinutes: number | null | undefined,
  scheduledTime: string | null | undefined
): string | null {
  if (etaMinutes == null || etaMinutes <= 0) return null
  if (!scheduledTime) return "~" + etaMinutes + " min"

  const parts = String(scheduledTime).split(":")
  const baseH = parseInt(parts[0], 10)
  const baseM = parseInt(parts[1] || "0", 10)
  if (isNaN(baseH) || isNaN(baseM)) return "~" + etaMinutes + " min"

  const totalMin = baseH * 60 + baseM + etaMinutes
  const dayOffset = Math.floor(totalMin / 1440)
  const modMin = ((totalMin % 1440) + 1440) % 1440
  const ah = Math.floor(modMin / 60)
  const am = modMin % 60
  const ampm = ah >= 12 ? "PM" : "AM"
  const h12 = ah % 12 === 0 ? 12 : ah % 12
  const timeStr = h12 + ":" + String(am).padStart(2, "0") + " " + ampm

  if (dayOffset > 0) return "~" + timeStr + " (+" + dayOffset + "d)"
  return "~" + timeStr
}