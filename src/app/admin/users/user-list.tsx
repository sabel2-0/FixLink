"use client"

import { useMemo, useState } from "react"
import { BlueCheck } from "@/components/admin/blue-check"
import { UserDocsButton } from "./user-docs-button"
import { UserActions } from "./user-actions"

type RoleFilter = "all" | "customer" | "technician" | "admin"
type StatusFilter = "all" | "active" | "suspended"

export function UserList({ users, deleted = [] }: { users: any[]; deleted?: any[] }) {
  const [role, setRole] = useState<RoleFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")

  // Counts are context-aware: role counts respect the current status filter,
  // status counts respect the current role filter. So a "0" always explains
  // itself when you look at the other row.
  const roleCounts = useMemo(() => {
    const base = status === "all"
      ? users
      : users.filter(u => {
          const s = u.status || "active"
          return s === status
        })
    return {
      all: base.length,
      customer: base.filter(u => u.role === "customer").length,
      technician: base.filter(u => u.role === "technician").length,
      admin: base.filter(u => u.role === "admin").length,
    }
  }, [users, status])

  const statusCounts = useMemo(() => {
    const base = role === "all"
      ? users
      : users.filter(u => u.role === role)
    return {
      all: base.length,
      active: base.filter(u => (u.status || "active") === "active").length,
      suspended: base.filter(u => u.status === "suspended").length,
    }
  }, [users, role])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (role !== "all" && u.role !== role) return false
      if (status !== "all") {
        const s = u.status || "active"
        if (status === "active" && s !== "active") return false
        if (status === "suspended" && s !== "suspended") return false
      }
      if (!q) return true
      return (u.full_name || "").toLowerCase().includes(q)
        || (u.email || "").toLowerCase().includes(q)
    })
  }, [users, role, status, search])

  const roleTabs: Array<{ key: RoleFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: roleCounts.all },
    { key: "customer", label: "Customers", count: roleCounts.customer },
    { key: "technician", label: "Technicians", count: roleCounts.technician },
    { key: "admin", label: "Admins", count: roleCounts.admin },
  ]

  const statusTabs: Array<{ key: StatusFilter; label: string; count: number; tone?: "success" | "danger" }> = [
    { key: "all", label: "Any status", count: statusCounts.all },
    { key: "active", label: "Active", count: statusCounts.active, tone: "success" },
    { key: "suspended", label: "Suspended", count: statusCounts.suspended, tone: "danger" },
  ]

  return (
    <>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search name or email…"
        className="input w-full mb-4"
      />

      <div className="space-y-2 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {roleTabs.map(t => (
            <button key={t.key} type="button" onClick={() => setRole(t.key)}
              className={`chip shrink-0 ${role === t.key ? "chip-active" : ""}`}>
              {t.label} <span className="opacity-70">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {statusTabs.map(t => {
            const active = status === t.key
            const style = active
              ? t.tone === "success"
                ? { background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)" }
                : t.tone === "danger"
                ? { background: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)" }
                : { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
              : { background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line-2)" }

            return (
              <button key={t.key} type="button" onClick={() => setStatus(t.key)}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition active:scale-[0.98]"
                style={style}>
                {t.label} <span className="opacity-70">{t.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          {search ? "No users match your search." : "No users in this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => <UserCard key={u.id} u={u} />)}
        </div>
      )}

      {deleted.length > 0 && <DeletedAccounts rows={deleted} />}
    </>
  )
}

function DeletedAccounts({ rows }: { rows: any[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium mb-3 hover:text-ink transition"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Deleted accounts ({rows.length})
      </button>

      {open && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {rows.map(r => (
              <div key={r.id} className="p-4 flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                    color: "var(--danger)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-ink truncate">{r.full_name || "—"}</p>
                    <span className="badge badge-suspended">{r.role || "user"}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{r.email || "—"}</p>
                  {r.reason && (
                    <p className="text-xs text-muted mt-1 italic">Reason: {r.reason}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Deleted by</p>
                  <p className="text-xs text-ink mt-0.5">{r.deleted_by_name || "—"}</p>
                  <p className="text-[10px] text-muted mt-1">
                    {r.deleted_at ? new Date(r.deleted_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserCard({ u }: { u: any }) {
  const isTech = u.role === "technician"
  const t = u.tech
  const isVerified = isTech ? t?.cert_status === "verified" : u.verification_status === "verified"
  const isSuspended = u.status === "suspended"

  return (
    <div
      className="card p-4 sm:p-5"
      style={isSuspended ? { borderLeft: "3px solid var(--danger)" } : undefined}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-semibold truncate ${isSuspended ? "text-muted" : "text-ink"}`}>
              {u.full_name || "Unnamed"}
            </h3>
            {isVerified && <BlueCheck />}
            <RoleBadge role={u.role} />
            {isTech && t?.cert_status && <StatusPill status={t.cert_status} />}
            {!isTech && u.role === "customer" && u.verification_status && u.verification_status !== "unverified" && (
              <StatusPill status={u.verification_status} />
            )}
            {isSuspended && (
              <span className="badge badge-suspended">suspended</span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
        </div>

        <UserDocsButton
          name={u.full_name || "User"}
          isTech={isTech}
          certFileUrl={t?.cert_file_url || null}
          idFrontUrl={u.id_front_url}
          idBackUrl={u.id_back_url}
          selfieUrl={u.selfie_url}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mt-4 mb-4">
        <DetailBlock label="Phone" value={u.phone || "—"} />
        <DetailBlock label="Joined" value={u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"} />
        {isTech && t?.cert_trade && <DetailBlock label="Trade" value={t.cert_trade} />}
        {isTech && t?.cert_number && <DetailBlock label="Cert #" value={t.cert_number} mono />}
      </div>

      {u.role !== "admin" && (
        <div className="pt-3 border-t border-line">
          <UserActions
            userId={u.id}
            userName={u.full_name || "this user"}
            status={u.status || "active"}
          />
        </div>
      )}
    </div>
  )
}

function DetailBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted font-medium">{label}</span>
      <span className={`text-ink text-sm truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const cls = role === "admin" ? "badge-active" : role === "technician" ? "badge-info" : "badge-completed"
  return <span className={`badge ${cls}`}>{role}</span>
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "verified" ? "badge-active"
    : status === "pending" ? "badge-pending"
    : status === "rejected" ? "badge-suspended"
    : "badge-completed"
  return <span className={`badge ${cls}`}>{status}</span>
}