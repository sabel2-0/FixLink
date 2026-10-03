import { createClient } from "@/lib/supabase/server"
import { UserList } from "./user-list"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Only show approved accounts:
  //  - admins
  //  - customers with verification_status = 'verified'
  //  - technicians with cert_status = 'verified'
  const [profilesRes, techRes, deletedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, status, created_at, id_front_url, id_back_url, selfie_url, verification_status")
      .order("created_at", { ascending: false }),
    supabase
      .from("technician_profiles")
      .select("id, cert_number, cert_trade, cert_file_url, cert_status"),
    supabase
      .from("deleted_accounts")
      .select("id, original_user_id, full_name, email, phone, role, reason, deleted_by_name, deleted_at")
      .order("deleted_at", { ascending: false })
      .limit(100),
  ])

  const allProfiles = profilesRes.data ?? []
  const techById = new Map((techRes.data ?? []).map((t: any) => [t.id, t]))

  const approved = allProfiles
    .filter((p: any) => {
      if (p.role === "admin") return true
      if (p.role === "customer") return p.verification_status === "verified"
      if (p.role === "technician") return techById.get(p.id)?.cert_status === "verified"
      return false
    })
    .map((p: any) => ({ ...p, tech: techById.get(p.id) || null }))

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-ink tracking-tight">Users</h1>
      <p className="text-muted text-sm mb-6">
        Approved accounts only. Pending and rejected applications live under Registrations.
      </p>

      <UserList users={approved} deleted={deletedRes.data ?? []} />
    </div>
  )
}