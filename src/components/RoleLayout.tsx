"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Icon, IconName } from "@/lib/icons"
import { useState, useEffect, ReactNode } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationsBell } from "@/components/NotificationsBell"

export type NavItem = { href: string; label: string; icon: IconName }

type Counts = { messages: number; estimates: number; jobs: number }

export function RoleLayout({
  roleLabel,
  nav,
  initials,
  children,
}: {
  roleLabel: string
  nav: NavItem[]
  initials: string
  children: ReactNode
}) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<Counts>({ messages: 0, estimates: 0, jobs: 0 })

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      // Messages: unread received
      const { count: mc } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null)

      let estCount = 0
      let jobCount = 0

      if (roleLabel === "Technician") {
        // Active assigned jobs
        const { count: jc } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("technician_id", user.id)
          .not("status", "in", "(completed,cancelled,disputed)")
        jobCount = jc || 0

        // Open estimate requests I haven't responded to
        const { data: invites } = await supabase
          .from("booking_requested_techs")
          .select("booking_id")
          .eq("technician_id", user.id)
        const invitedIds = (invites || []).map((r: any) => r.booking_id)

        if (invitedIds.length > 0) {
          const { data: myEst } = await supabase
            .from("estimates")
            .select("booking_id")
            .eq("technician_id", user.id)
          const estimatedSet = new Set((myEst || []).map((e: any) => e.booking_id))

          const { data: open } = await supabase
            .from("bookings")
            .select("id")
            .in("id", invitedIds)
            .in("status", ["pending", "estimated"])
            .is("technician_id", null)

          estCount = (open || []).filter((b: any) => !estimatedSet.has(b.id)).length
        }
      }

      if (!cancelled) setCounts({ messages: mc || 0, estimates: estCount, jobs: jobCount })
    }

    load()

    function onRead() { load() }
    window.addEventListener("fixlink:messages-read", onRead)

    const tables = roleLabel === "Technician"
      ? ["messages", "bookings", "estimates", "booking_requested_techs"]
      : ["messages"]

    let ch = supabase.channel("nav-counts:" + roleLabel)
    for (const table of tables) {
      ch = ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => { console.log("[nav-realtime] change on", table); load() }
      )
    }
    ch.subscribe()

    const poll = setInterval(() => load(), 5000)

    return () => {
      cancelled = true
      clearInterval(poll)
      window.removeEventListener("fixlink:messages-read", onRead)
      supabase.removeChannel(ch)
    }
  }, [supabase, path, roleLabel])

  function countFor(href: string): number {
    if (href.endsWith("/messages")) return counts.messages
    if (href.endsWith("/estimates")) return counts.estimates
    if (href.endsWith("/schedule")) return counts.jobs
    return 0
  }

  const links = (
    <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      {nav.map((n) => {
        const c = countFor(n.href)
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`sidenav-link ${path === n.href ? "active" : ""}`}
          >
            <Icon name={n.icon} className="w-[17px] h-[17px]" />
            <span className="flex-1">{n.label}</span>
            {c > 0 && (
              <span
                className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                {c > 9 ? "9+" : c}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const userBlock = (
    <div className="p-2 border-t border-line shrink-0 space-y-0.5">
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="badge badge-info">{roleLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <div className="w-7 h-7 rounded-full bg-surface-2 text-ink flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initials}
          </div>
        </div>
      </div>
      <button onClick={logout} className="sidenav-link w-full" type="button">
        <Icon name="logout" className="w-[17px] h-[17px]" />
        <span>Log out</span>
      </button>
    </div>
  )

  return (
    <div className="h-dvh flex bg-paper overflow-hidden">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-surface border-r border-line h-full overflow-hidden">
        <div className="h-14 shrink-0 flex items-center px-5 border-b border-line">
          <Link href="/" className="display text-base font-semibold text-ink tracking-tight">
            FixLink
          </Link>
        </div>
        {links}
        {userBlock}
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-surface z-50 md:hidden flex flex-col transition-transform duration-200 h-full ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-line">
          <Link href="/" className="display text-base font-semibold text-ink tracking-tight">
            FixLink
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="icon-btn"
            type="button"
            aria-label="Close menu"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        {links}
        {userBlock}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col h-full">
        <header className="h-12 shrink-0 flex items-center justify-between px-4 topnav z-30">
          <button
            className="text-ink md:hidden"
            onClick={() => setOpen(true)}
            type="button"
            aria-label="Open menu"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          <div className="hidden md:block" />

          <div className="flex items-center gap-1">
            <NotificationsBell />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
