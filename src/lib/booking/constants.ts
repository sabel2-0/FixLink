export type ServiceCategory = "appliance" | "device"

export type ServiceDef = {
  id: string
  label: string
  category: ServiceCategory
}

export const SERVICES: readonly ServiceDef[] = [
  // ── Appliances ──
  { id: "aircon",    label: "Aircon",              category: "appliance" },
  { id: "ref",       label: "Refrigerator",        category: "appliance" },
  { id: "freezer",   label: "Freezer",             category: "appliance" },
  { id: "washer",    label: "Washing Machine",     category: "appliance" },
  { id: "dryer",     label: "Dryer",               category: "appliance" },
  { id: "tv",        label: "TV",                  category: "appliance" },
  { id: "water",     label: "Water Heater",        category: "appliance" },
  { id: "micro",     label: "Microwave",           category: "appliance" },
  { id: "oven",      label: "Oven / Toaster Oven", category: "appliance" },
  { id: "fan",       label: "Electric Fan",        category: "appliance" },
  { id: "rice",      label: "Rice Cooker",         category: "appliance" },
  { id: "kettle",    label: "Electric Kettle",     category: "appliance" },
  { id: "stove",     label: "Induction Stove",     category: "appliance" },
  { id: "blender",   label: "Blender",             category: "appliance" },
  { id: "airfryer",  label: "Air Fryer",           category: "appliance" },
  { id: "coffee",    label: "Coffee Maker",        category: "appliance" },
  { id: "vacuum",    label: "Vacuum Cleaner",      category: "appliance" },
  { id: "dispenser", label: "Water Dispenser",     category: "appliance" },
  { id: "gasp",      label: "Gas Stove",           category: "appliance" },

  // ── Devices (require TESDA CSS NC II for the technician) ──
  { id: "phone",     label: "Mobile Phone",        category: "device" },
  { id: "tablet",    label: "Tablet",              category: "device" },
  { id: "laptop",    label: "Laptop",              category: "device" },
  { id: "desktop",   label: "Desktop PC",          category: "device" },
  { id: "printer",   label: "Printer",             category: "device" },
  { id: "router",    label: "WiFi Router",         category: "device" },
  { id: "cctv",      label: "CCTV",                category: "device" },
  { id: "console",   label: "Game Console",        category: "device" },
]

export function servicesByCategory(cat: ServiceCategory): ServiceDef[] {
  return SERVICES.filter((s) => s.category === cat)
}

export function categoryOfService(label: string): ServiceCategory | null {
  const svc = SERVICES.find((s) => s.label === label)
  return svc ? svc.category : null
}

export const COMMON_PROBLEMS: Record<string, string[]> = {
  // ── Appliances ──
  aircon:    ["Not cooling / weak air", "Water leaking", "Strange noise", "Needs cleaning", "Won't turn on", "Remote not working", "Bad smell"],
  ref:       ["Not cooling", "Freezer works but fridge doesn't", "Leaking", "Strange noise", "Ice buildup", "Won't turn on"],
  freezer:   ["Not freezing", "Ice buildup", "Leaking", "Strange noise", "Won't turn on"],
  washer:    ["Not spinning", "Won't drain", "Leaking", "Won't start", "Strange noise", "Door or lid issue"],
  dryer:     ["Not heating", "Not spinning", "Takes too long to dry", "Won't start", "Strange noise"],
  tv:        ["No picture", "No sound", "Screen lines or spots", "Won't turn on", "Remote issue", "HDMI or port issue"],
  water:     ["No hot water", "Leaking", "Pilot won't light", "Strange noise"],
  micro:     ["Not heating", "Sparking", "Turntable not spinning", "Won't start"],
  oven:      ["Not heating", "Uneven heating", "Won't turn on", "Door won't close", "Error code showing"],
  fan:       ["Not spinning", "Weak airflow", "Strange noise", "Won't turn on"],
  rice:      ["Not heating", "Doesn't switch to warm", "Leaking"],
  kettle:    ["Not boiling", "Auto-off too early", "Leaking"],
  stove:     ["Not heating", "Error code showing", "Won't turn on"],
  blender:   ["Blades not spinning", "Motor burnt out", "Leaking from base", "Won't turn on", "Strange noise"],
  airfryer:  ["Not heating", "Fan not working", "Won't turn on", "Strange noise", "Error code showing"],
  coffee:    ["Not brewing", "Leaking", "Won't turn on", "Water not heating", "Descaling needed"],
  vacuum:    ["Loss of suction", "Motor burnt out", "Won't turn on", "Strange noise", "Bag/filter issue"],
  dispenser: ["Not heating water", "Not cooling water", "Leaking", "Won't turn on", "Dispensing issue"],
  gasp:      ["Burner won't light", "Weak flame", "Gas smell / leak", "Won't turn on", "Knob issue"],

  // ── Devices (CSS NC II) ──
  phone:     ["Cracked screen", "Battery drains fast", "Won't charge", "Won't turn on", "Speaker not working", "Microphone issue", "Camera issue", "Water damage", "Software stuck / boot loop"],
  tablet:    ["Cracked screen", "Battery issue", "Won't charge", "Won't turn on", "Touchscreen not responding", "Water damage"],
  laptop:    ["Won't boot", "Cracked screen", "Battery issue", "Overheating", "Slow performance", "Keyboard not working", "Charging port issue", "Water damage", "WiFi/Bluetooth issue"],
  desktop:   ["Won't power on", "Blue screen / crashes", "Overheating", "Slow performance", "No display", "Overheating / fans loud", "Storage failure"],
  printer:   ["Not printing", "Paper jam", "Ink not coming out", "Streaky prints", "WiFi / USB connectivity issue", "Error code showing"],
  router:    ["No internet", "Slow WiFi", "Won't connect to devices", "Needs setup / configuration", "Cable/port issue"],
  cctv:      ["No recording", "Camera offline", "Night vision broken", "Needs setup / configuration", "DVR issue"],
  console:   ["Won't turn on", "Controller issue", "Overheating", "Disc drive not working", "HDMI port issue", "WiFi not connecting", "Software stuck / boot loop"],
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
