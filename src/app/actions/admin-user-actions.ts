"use server"

import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")
  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single()
  if (profile?.role !== "admin") throw new Error("Admin only")
  return { supabase, adminId: user.id, adminName: profile.full_name || "Admin" }
}

export async function deactivateUser(userId: string) {
  const { supabase, adminId } = await requireAdmin()
  if (adminId === userId) throw new Error("You can't deactivate your own account")

  const { error } = await supabase
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function reactivateUser(userId: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function deleteUserPermanently(userId: string, reason?: string) {
  const { supabase, adminId, adminName } = await requireAdmin()
  if (adminId === userId) throw new Error("You can't delete your own account")

  // 1. Snapshot for the audit log (survives user deletion)
  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role")
    .eq("id", userId)
    .single()

  if (!target) throw new Error("User not found")

  await supabase.from("deleted_accounts").insert({
    original_user_id: target.id,
    full_name: target.full_name,
    email: target.email,
    phone: target.phone,
    role: target.role,
    reason: reason || null,
    deleted_by_id: adminId,
    deleted_by_name: adminName,
  })

  // 2. Delete auth.users via the admin RPC — cascades to profiles + everything else
  const { error } = await supabase.rpc("admin_delete_user", { target_id: userId })

  if (error) {
    if (error.message.includes("foreign key") || error.message.includes("violates")) {
      throw new Error("Can't delete — this user has active bookings. Deactivate instead.")
    }
    throw new Error(error.message)
  }

  return { ok: true }
}