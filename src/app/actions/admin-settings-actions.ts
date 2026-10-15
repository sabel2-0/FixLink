"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const ROUTES = [
  "/", "/terms", "/privacy", "/about", "/help", "/login", "/register",
  "/app", "/app/book", "/app/bookings",
  "/tech", "/tech/earnings", "/tech/commissions",
  "/admin", "/admin/settings",
] as const

export type VerifyRow = {
  route: string
  status: number
  literalFixLink: number
  previousNameCount: number
  newNameCount: number
  title: string
  error?: string
}

export type MojibakeRow = {
  route: string
  status: number
  hits: number
  samples: string[]
}

type ActionResult<T> = { ok: true; rows: T[] } | { ok: false; error: string }

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Not signed in" }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile || profile.role !== "admin") return { ok: false as const, error: "Admin only" }
  return { ok: true as const }
}

async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  const h = await headers()
  const host = h.get("host") ?? "localhost:3000"
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"
  return proto + "://" + host
}

async function getSettings(): Promise<{ siteName: string; previousName: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("app_settings")
    .select("site_name, previous_site_name")
    .eq("id", 1)
    .maybeSingle()
  return {
    siteName: data?.site_name || "FixLink",
    previousName: data?.previous_site_name ?? null,
  }
}

function boundRe(s: string) {
  return new RegExp("(?<![\\w])" + escapeRegex(s) + "(?![\\w])", "g")
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function verifyRename(): Promise<ActionResult<VerifyRow>> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const base = await getBaseUrl()
  const { siteName: currentName, previousName } = await getSettings()
  const h = await headers()
  const cookie = h.get("cookie") ?? ""

  const rows: VerifyRow[] = []
  for (const route of ROUTES) {
    try {
      const res = await fetch(base + route, {
        headers: { cookie },
        cache: "no-store",
        redirect: "follow",
      })
      const html = await res.text()
      const literalFixLink = currentName === "FixLink"
        ? 0
        : (html.match(boundRe("FixLink")) ?? []).length
      const newNameCount = (html.match(boundRe(currentName)) ?? []).length
      const previousNameCount =
        previousName &&
        previousName !== currentName &&
        !currentName.includes(previousName) &&
        !previousName.includes(currentName)
          ? (html.match(boundRe(previousName)) ?? []).length
          : 0
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      rows.push({
        route,
        status: res.status,
        literalFixLink,
        previousNameCount,
        newNameCount,
        title: titleMatch ? titleMatch[1] : "(no title)",
      })
    } catch (err) {
      rows.push({
        route,
        status: 0,
        literalFixLink: 0,
        previousNameCount: 0,
        newNameCount: 0,
        title: "",
        error: err instanceof Error ? err.message : "fetch failed",
      })
    }
  }
  return { ok: true, rows }
}

// Mojibake signatures as Unicode escapes - source stays ASCII
const MOJIBAKE_SIGNATURES = [
  "\u00E2\u20AC\u201D",   // a-euro-rightdquote  (em-dash mojibake)
  "\u00E2\u20AC\u0153",   // a-euro-oe           (left dquote mojibake)
  "\u00E2\u20AC\u009D",   // a-euro-ctrl         (right dquote mojibake)
  "\u00E2\u20AC\u00A6",   // a-euro-broken-bar   (ellipsis mojibake)
  "\u00E2\u201A\u00B1",   // a-sbquo-plusminus   (peso mojibake)
  "\u00E2\u2020\u2019",   // a-dagger-rsquo      (right arrow mojibake)
  "\u00E2\u2020\u0090",   // a-dagger-ctrl       (left arrow mojibake)
  "\u00C2\u00B7",         // A-middot            (middle dot mojibake)
  "\u00E2\u02DC\u2026",   // a-smile-ellipsis    (star mojibake)
  "\u00E2\u0153\u201C",   // a-oe-ldquo          (check mojibake)
  "\u00C3\u00A9",         // A-copyright         (e-acute mojibake)
  "\u00C3\u00B1",         // A-plusminus         (n-tilde mojibake)
  "\u00E2\u20AC\u2122",   // a-euro-trade        (rsquo mojibake)
  "\u00E2\u20AC\u02DC",   // a-euro-smile        (lsquo mojibake)
]

export async function scanMojibake(): Promise<ActionResult<MojibakeRow>> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const base = await getBaseUrl()
  const h = await headers()
  const cookie = h.get("cookie") ?? ""

  const rows: MojibakeRow[] = []
  for (const route of ROUTES) {
    try {
      const res = await fetch(base + route, {
        headers: { cookie },
        cache: "no-store",
        redirect: "follow",
      })
      const html = await res.text()
      const samples: string[] = []
      let total = 0
      for (const sig of MOJIBAKE_SIGNATURES) {
        const idx = html.indexOf(sig)
        if (idx >= 0) {
          total += (html.match(new RegExp(escapeRegex(sig), "g")) ?? []).length
          if (samples.length < 3) {
            const start = Math.max(0, idx - 30)
            const end = Math.min(html.length, idx + sig.length + 30)
            samples.push(html.slice(start, end).replace(/\s+/g, " "))
          }
        }
      }
      rows.push({ route, status: res.status, hits: total, samples })
    } catch (err) {
      rows.push({ route, status: 0, hits: -1, samples: [err instanceof Error ? err.message : "fetch failed"] })
    }
  }
  return { ok: true, rows }
}