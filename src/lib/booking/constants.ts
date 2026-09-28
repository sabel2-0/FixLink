export const SERVICES = [
  { id: "aircon", label: "Aircon" },
  { id: "ref", label: "Refrigerator" },
  { id: "washer", label: "Washing Machine" },
  { id: "tv", label: "TV" },
  { id: "water", label: "Water Heater" },
  { id: "micro", label: "Microwave" },
  { id: "fan", label: "Electric Fan" },
  { id: "rice", label: "Rice Cooker" },
  { id: "kettle", label: "Electric Kettle" },
  { id: "stove", label: "Induction Stove" },
] as const

export const COMMON_PROBLEMS: Record<string, string[]> = {
  aircon: ["Not cooling / weak air", "Water leaking", "Strange noise", "Needs cleaning", "Won't turn on", "Remote not working", "Bad smell"],
  ref: ["Not cooling", "Freezer works but fridge doesn't", "Leaking", "Strange noise", "Ice buildup", "Won't turn on"],
  washer: ["Not spinning", "Won't drain", "Leaking", "Won't start", "Strange noise", "Door or lid issue"],
  tv: ["No picture", "No sound", "Screen lines or spots", "Won't turn on", "Remote issue", "HDMI or port issue"],
  water: ["No hot water", "Leaking", "Pilot won't light", "Strange noise"],
  micro: ["Not heating", "Sparking", "Turntable not spinning", "Won't start"],
  fan: ["Not spinning", "Weak airflow", "Strange noise", "Won't turn on"],
  rice: ["Not heating", "Doesn't switch to warm", "Leaking"],
  kettle: ["Not boiling", "Auto-off too early", "Leaking"],
  stove: ["Not heating", "Error code showing", "Won't turn on"],
}

export const BARANGAYS = [
  { name: "Lahug", lat: 10.3272, lng: 123.9033 },
  { name: "Mabolo", lat: 10.3157, lng: 123.9187 },
  { name: "Talamban", lat: 10.3639, lng: 123.9153 },
  { name: "Banilad", lat: 10.3391, lng: 123.9115 },
  { name: "IT Park / Apas", lat: 10.3298, lng: 123.9057 },
  { name: "Guadalupe", lat: 10.3115, lng: 123.8886 },
  { name: "Capitol Site", lat: 10.3145, lng: 123.8925 },
  { name: "Mandaue Centro", lat: 10.3237, lng: 123.9224 },
]

export function nearestBarangay(lat: number, lng: number) {
  let best = BARANGAYS[0]
  let bestD = Infinity
  for (const b of BARANGAYS) {
    const d = haversine(lat, lng, b.lat, b.lng)
    if (d < bestD) { bestD = d; best = b }
  }
  return best
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export const LIFECYCLE = ["pending", "estimated", "confirmed", "en_route", "arrived", "in_progress", "quote_pending", "completed"]
export const TERMINAL = ["completed", "cancelled", "disputed"]

export function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}
