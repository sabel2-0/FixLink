import { createClient } from "@/lib/supabase/server"
import { VerifyButtons } from "./verify-buttons"

export default async function AdminTechniciansPage() {
  const supabase = await createClient()

  const { data: technicians } = await supabase
    .from("technician_profiles")
    .select("id, cert_number, cert_trade, cert_file_path, cert_status, profiles(full_name, email)")
    .order("cert_submitted_at", { ascending: false })

  const rows = await Promise.all(
    (technicians ?? []).map(async (t) => {
      let signedUrl: string | null = null
      if (t.cert_file_path) {
        const { data } = await supabase.storage
          .from("certs")
          .createSignedUrl(t.cert_file_path, 60 * 5)
        signedUrl = data?.signedUrl ?? null
      }
      return { ...t, signedUrl }
    })
  )

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-ink tracking-tight">Technicians</h1>
      <p className="text-muted mb-6">
        Verification is skills-based: technicians submit a TESDA NC2 certificate (or equivalent) before
        &quot;Verified&quot; appears on their profile.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[750px]">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-line">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Trade</th>
              <th className="p-4 font-medium">Cert number</th>
              <th className="p-4 font-medium">Certificate</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((t: any) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium text-ink">{t.profiles?.full_name}</td>
                  <td className="p-4 text-ink">{t.cert_trade || "—"}</td>
                  <td className="p-4 text-muted">{t.cert_number || "—"}</td>
                  <td className="p-4">
                    {t.signedUrl ? (
                      <a href={t.signedUrl} target="_blank" rel="noreferrer" className="btn-link text-xs">
                        View file
                      </a>
                    ) : (
                      <span className="text-muted text-xs">No file</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`badge badge-${t.cert_status === "verified" ? "active" : t.cert_status === "pending" ? "pending" : "suspended"}`}>
                      {t.cert_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <VerifyButtons technicianId={t.id} currentStatus={t.cert_status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-muted text-center" colSpan={6}>
                  No technicians yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
