"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { NearbyMap } from "@/components/booking/NearbyMap"
import {
  getRegions, getProvinces, getCities, getBarangays,
  type PsgcRegion, type PsgcProvince, type PsgcCity, type PsgcBarangay,
} from "@/lib/psgc"

const SERVICE_OPTIONS = [
  "Aircon", "Refrigerator", "Washing Machine", "TV", "Water Heater",
  "Microwave", "Electric Fan", "Rice Cooker", "Electric Kettle", "Induction Stove",
]

export function ResubmitForm({
  defaultCertNumber, defaultCertTrade,
  defaultBarangay, defaultAddress, defaultServices,
  defaultLat, defaultLng, defaultCity,
  defaultRegion, defaultProvince,
}: {
  defaultCertNumber: string
  defaultCertTrade: string
  defaultBarangay?: string
  defaultCity?: string
  defaultRegion?: string
  defaultProvince?: string
  defaultAddress?: string
  defaultServices?: string[]
  defaultLat?: number | null
  defaultLng?: number | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(0)

  const [certNumber, setCertNumber] = useState(defaultCertNumber)
  const [certTrade, setCertTrade]   = useState(defaultCertTrade)
  const [certFile, setCertFile]     = useState<File | null>(null)

  // Location cascade
  const [regions, setRegions]     = useState<PsgcRegion[]>([])
  const [provinces, setProvinces] = useState<PsgcProvince[]>([])
  const [cities, setCities]       = useState<PsgcCity[]>([])
  const [barangays, setBarangays] = useState<PsgcBarangay[]>([])

  const [regionCode, setRegionCode]     = useState<string>("")
  const [provinceCode, setProvinceCode] = useState<string>("")
  const [cityCode, setCityCode]         = useState<string>("")
  const [barangay, setBarangay]         = useState<string>(defaultBarangay || "")

  const [address, setAddress]   = useState(defaultAddress || "")
  const [services, setServices] = useState<string[]>(defaultServices || [])
  const [homeLat, setHomeLat]   = useState<number | null>(defaultLat ?? null)
  const [homeLng, setHomeLng]   = useState<number | null>(defaultLng ?? null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack]   = useState<File | null>(null)
  const [selfie, setSelfie]   = useState<File | null>(null)

  const TOTAL = 3
  const LABELS = ["Certification", "Location & services", "Identity documents"]

  // Load regions once
  useEffect(() => {
    getRegions().then(setRegions).catch(console.error)
  }, [])

  // Prefill region by name
  useEffect(() => {
    if (!defaultRegion || !regions.length || regionCode) return
    const r = regions.find((x) => x.name.toLowerCase() === defaultRegion.toLowerCase())
    if (r) setRegionCode(r.code)
  }, [regions, defaultRegion, regionCode])

  // Load provinces when region changes
  useEffect(() => {
    if (!regionCode) { setProvinces([]); setCities([]); setBarangays([]); return }
    getProvinces(regionCode).then((list) => {
      setProvinces(list)
      // Regions without provinces (e.g. Metro Manila, HUC-only) — load cities directly
      if (list.length === 0) {
        getCities(regionCode, null).then(setCities).catch(console.error)
      }
    }).catch(console.error)
  }, [regionCode])

  // Prefill province by name
  useEffect(() => {
    if (!defaultProvince || !provinces.length || provinceCode) return
    const p = provinces.find((x) => x.name.toLowerCase() === defaultProvince.toLowerCase())
    if (p) setProvinceCode(p.code)
  }, [provinces, defaultProvince, provinceCode])

  // Load cities when province changes (or if region has no provinces)
  useEffect(() => {
    if (!regionCode) return
    if (!provinceCode) return
    getCities(regionCode, provinceCode).then(setCities).catch(console.error)
  }, [regionCode, provinceCode])

  // Prefill city by name
  useEffect(() => {
    if (!defaultCity || !cities.length || cityCode) return
    const c = cities.find((x) => x.name.toLowerCase() === defaultCity.toLowerCase())
    if (c) setCityCode(c.code)
  }, [cities, defaultCity, cityCode])

  // Load barangays when city changes
  useEffect(() => {
    if (!cityCode) { setBarangays([]); return }
    getBarangays(cityCode).then(setBarangays).catch(console.error)
  }, [cityCode])

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function detectLocation() {
    if (!navigator.geolocation) return setLocationStatus("error")
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => { setHomeLat(pos.coords.latitude); setHomeLng(pos.coords.longitude); setLocationStatus("done") },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function next() {
    setError(null)
    if (step === 0) {
      if (!certNumber.trim() || !certTrade.trim()) { setError("Certificate number and trade are required."); return }
      if (!certFile) { setError("Please upload your certificate."); return }
    }
    if (step === 1) {
      if (!regionCode) { setError("Please select your region."); return }
      if (provinces.length > 0 && !provinceCode) { setError("Please select your province."); return }
      if (!cityCode) { setError("Please select your city / municipality."); return }
      if (!barangay) { setError("Please select your barangay."); return }
      if (!address.trim() || address.trim().length < 5) { setError("Please enter your street / landmark."); return }
      if (homeLat == null || homeLng == null) {
        setError("Please capture your exact location so we can match you with nearby customers."); return
      }
      if (services.length === 0) { setError("Pick at least one service."); return }
    }
    setStep((s) => Math.min(TOTAL - 1, s + 1))
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  async function onSubmit() {
    setError(null)
    if (!idFront || !idBack || !selfie) { setError("Please upload all three: ID front, ID back, and selfie."); return }

    setBusy(true)
    try {
      const [certUrl, frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(certFile!, "cert"),
        uploadToCloudinary(idFront, "id-front"),
        uploadToCloudinary(idBack, "id-back"),
        uploadToCloudinary(selfie, "selfie"),
      ])

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const regionName   = regions.find((r) => r.code === regionCode)?.name || ""
      const provinceName = provinces.find((p) => p.code === provinceCode)?.name || ""
      const cityName     = cities.find((c) => c.code === cityCode)?.name || ""

      await supabase.from("profiles").update({
        id_front_url: frontUrl, id_back_url: backUrl, selfie_url: selfieUrl,
      }).eq("id", user.id)

      await supabase.from("technician_profiles").update({
        cert_number: certNumber.trim(),
        cert_trade: certTrade.trim(),
        cert_file_url: certUrl,
        cert_status: "pending",
        cert_rejection_reason: null,
        cert_submitted_at: new Date().toISOString(),
        cert_resubmitted_at: new Date().toISOString(),
        home_region: regionName,
        home_province: provinceName,
        home_city: cityName,
        home_barangay: barangay,
        service_address: address.trim(),
        home_lat: homeLat,
        home_lng: homeLng,
      }).eq("id", user.id)

      await supabase.from("technician_services").delete().eq("technician_id", user.id)
      await supabase.from("technician_services").insert(
        services.map((s) => ({ technician_id: user.id, service: s }))
      )

      setSuccess(true)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resubmission failed")
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="card p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
             style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink tracking-tight mb-2">Resubmitted</h2>
        <p className="text-sm text-muted">We&apos;ll review your new documents and email you with the result.</p>
      </div>
    )
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between text-xs text-muted">
          <span>Step {step + 1} of {TOTAL}</span>
          <span>{LABELS[step]}</span>
        </div>
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${((step + 1) / TOTAL) * 100}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink tracking-tight mb-1">Certification</h2>
          <p className="text-xs text-muted mb-4">Your NC2 certificate details.</p>
          <Field label="Certificate number">
            <input value={certNumber} onChange={(e) => setCertNumber(e.target.value)} className="input" />
          </Field>
          <Field label="Trade / certification">
            <input value={certTrade} onChange={(e) => setCertTrade(e.target.value)} className="input" />
          </Field>
          <FileField label="Upload certificate (PDF or image) *" file={certFile} onChange={setCertFile} accept="application/pdf,image/*" />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink tracking-tight mb-1">Location & services</h2>
          <p className="text-xs text-muted mb-4">Where you&apos;re based and what you can fix.</p>

          <Field label="Region *">
            <SearchableSelect
              value={regionCode}
              onChange={(v) => { setRegionCode(v); setProvinceCode(""); setCityCode(""); setBarangay("") }}
              options={regions.map((r) => ({ value: r.code, label: r.name }))}
              placeholder="Select your region…"
              searchPlaceholder="Search regions…"
              loading={regions.length === 0}
            />
          </Field>

          {regionCode && provinces.length > 0 && (
            <Field label="Province *">
              <SearchableSelect
                value={provinceCode}
                onChange={(v) => { setProvinceCode(v); setCityCode(""); setBarangay("") }}
                options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                placeholder="Select your province…"
                searchPlaceholder="Search provinces…"
              />
            </Field>
          )}

          <Field label="City / municipality *">
            <SearchableSelect
              value={cityCode}
              onChange={(v) => { setCityCode(v); setBarangay("") }}
              options={cities.map((c) => ({ value: c.code, label: c.name }))}
              placeholder={
                !regionCode ? "Pick a region first" :
                provinces.length > 0 && !provinceCode ? "Pick a province first" :
                "Select your city…"
              }
              searchPlaceholder="Search cities…"
              disabled={!regionCode || (provinces.length > 0 && !provinceCode)}
              loading={regionCode && (provinces.length === 0 || provinceCode) && cities.length === 0}
            />
          </Field>

          <Field label="Barangay *">
            <SearchableSelect
              value={barangay}
              onChange={setBarangay}
              options={barangays.map((b) => ({ value: b.name, label: b.name }))}
              placeholder={cityCode ? "Select your barangay…" : "Pick a city first"}
              searchPlaceholder="Search barangays…"
              disabled={!cityCode}
              loading={cityCode && barangays.length === 0}
            />
          </Field>

          <Field label="Street / landmark *">
            <input value={address} onChange={(e) => setAddress(e.target.value)}
                   placeholder="e.g. Unit 4B, Villa Aurora, near JY Square" className="input" />
          </Field>

          <div>
            <label className="input-label">Exact location *</label>
            <p className="text-xs text-muted mb-2 leading-relaxed">
              Customers see your <strong className="text-ink">barangay and approximate pin</strong> so
              they know you serve their area. Your exact GPS stays with admin for verification and is
              only shared with a customer during an active booking.
            </p>

            {locationStatus !== "done" ? (
              <>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locationStatus === "loading"}
                  className="btn-secondary w-full text-sm"
                >
                  {locationStatus === "loading" ? "Detecting…" : "Use my current location"}
                </button>
                {locationStatus === "error" && (
                  <p className="text-xs text-red-500 mt-2">
                    Couldn&apos;t access your location. Please allow location access and try again.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl overflow-hidden border border-line">
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "color-mix(in srgb, var(--success) 12%, transparent)" }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--success)", color: "#fff" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <p className="text-xs font-medium" style={{ color: "var(--success)" }}>
                    Location captured
                  </p>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="ml-auto text-[11px] text-muted hover:text-ink transition"
                  >
                    Re-capture
                  </button>
                </div>
                <div style={{ height: 200 }}>
                  <NearbyMap meLat={homeLat} meLng={homeLng} techs={[]} height="100%" hideLegend />
                </div>
                <div
                  className="px-3 py-1.5 text-[11px] text-muted font-mono text-center"
                  style={{ background: "var(--surface-2)" }}
                >
                  {homeLat?.toFixed(5)}, {homeLng?.toFixed(5)}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="input-label">Appliances you can fix *</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map((s) => {
                const selected = services.includes(s)
                return (
                  <button key={s} type="button" onClick={() => toggleService(s)}
                    className="text-sm px-3 py-2.5 rounded-lg border transition text-left"
                    style={{
                      background: selected ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--surface-2)",
                      borderColor: selected ? "var(--accent)" : "var(--line-2)",
                      color: selected ? "var(--accent)" : "var(--ink)",
                      fontWeight: selected ? 500 : 400,
                    }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink tracking-tight mb-1">Identity documents</h2>
          <p className="text-xs text-muted mb-4">Upload clear photos. No glare, all corners visible.</p>
          <FileField label="Government ID — front *" file={idFront} onChange={setIdFront} accept="image/*" />
          <FileField label="Government ID — back *"  file={idBack}  onChange={setIdBack}  accept="image/*" />
          <FileField label="Selfie holding your ID *" file={selfie} onChange={setSelfie} accept="image/*" />
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

      <div className="flex gap-2 mt-6">
        {step > 0 && (
          <button type="button" onClick={back} disabled={busy || pending} className="btn-secondary flex-1">
            Back
          </button>
        )}
        {step < TOTAL - 1 ? (
          <button type="button" onClick={next} className="btn-primary flex-1">Next</button>
        ) : (
          <button type="button" onClick={onSubmit} disabled={busy || pending} className="btn-primary flex-1">
            {busy ? "Uploading…" : "Resubmit for review"}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  )
}

function FileField({ label, file, onChange, accept }: {
  label: string; file: File | null; onChange: (f: File | null) => void; accept: string
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="input" />
      {file && <p className="text-xs text-muted mt-1">Selected: {file.name}</p>}
    </div>
  )
}