"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Icon, IconName } from "@/lib/icons"
import { useState, ReactNode } from "react"

export type NavItem = { href: string; label: string; icon: IconName }

export function RoleLayout({ roleLabel, nav, initials, children }: { roleLabel: string; nav: NavItem[]; initials: string; children: ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const links = (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`sidenav-link ${path === n.href ? "active" : ""}`}>
          <Icon name={n.icon} className="w-[17px] h-[17px]" />
          <span>{n.label}</span>
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-surface border-r border-line">
        <div className="h-11 flex items-center px-5 border-b border-line">
          <Link href="/" className="display text-base font-semibold text-ink">FixLink</Link>
        </div>
        <div className="px-5 pt-4"><span className="badge badge-info">{roleLabel}</span></div>
        {links}
        <div className="p-2 border-t border-line">
          <button onClick={logout} className="sidenav-link w-full">
            <Icon name="logout" className="w-[17px] h-[17px]" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 w-60 bg-surface z-50 md:hidden flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-11 flex items-center justify-between px-5 border-b border-line">
          <Link href="/" className="display text-base font-semibold text-ink">FixLink</Link>
          <button onClick={() => setOpen(false)} className="icon-btn"><Icon name="x" className="w-4 h-4" /></button>
        </div>
        <div className="px-5 pt-4"><span className="badge badge-info">{roleLabel}</span></div>
        {links}
        <div className="p-2 border-t border-line">
          <button onClick={logout} className="sidenav-link w-full">
            <Icon name="logout" className="w-[17px] h-[17px]" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-11 shrink-0 flex items-center justify-between px-4 topnav sticky top-0 z-30">
          <button className="md:hidden text-ink" onClick={() => setOpen(true)}>
            <Icon name="menu" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <button className="relative icon-btn"><Icon name="bell" className="w-5 h-5" /></button>
            <div className="w-7 h-7 rounded-full bg-surface-2 text-ink flex items-center justify-center text-[11px] font-semibold">{initials}</div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
