import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TechProfileForm } from "./tech-profile-form"
import { TechPaymentSettings } from "@/components/tech/TechPaymentSettings"

export default async function TechProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, phone, id_front_url, id_back_url, selfie_url")
    .eq("id", user.id)
    .single()

  const { data: tech } = await supabase
    .from("technician_profiles")
    .select("cert_number, cert_trade, cert_file_url, cert_status, cert_rejection_reason, home_region, home_province, home_city, home_barangay, service_address, home_lat, home_lng, gcash_number, maya_number, preferred_payment")
    .eq("id", user.id)
    .single()

  const { data: serviceRows } = await supabase
    .from("technician_services")
    .select("service")
    .eq("technician_id", user.id)

  return (
    <div className="space-y-6">
      <TechProfileForm
        profile={profile}
        tech={tech}
        services={(serviceRows ?? []).map((r: any) => r.service)}
      />

      <TechPaymentSettings
        techId={user.id}
        initial={{
          gcash_number: (tech as any)?.gcash_number ?? null,
          maya_number: (tech as any)?.maya_number ?? null,
          preferred_payment: (tech as any)?.preferred_payment ?? "cash",
        }}
      />
    </div>
  )
}
