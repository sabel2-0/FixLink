"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  getRegions, getProvinces, getCities, getBarangays,
  type PsgcRegion, type PsgcProvince, type PsgcCity, type PsgcBarangay,
} from "@/lib/psgc"
import { useRouter } from "next/navigation"
import { PasswordStrength } from "./password-strength"
import { NearbyMap } from "@/components/booking/NearbyMap"

type Role = "customer" | "technician"

const SERVICE_OPTIONS = [
  "Aircon", "Refrigerator", "Washing Machine", "TV", "Water Heater",
  "Microwave", "Electric Fan", "Rice Cooker", "Electric Kettle", "Induction Stove",
]

export function RegisterForm({ onRoleChange }: { onRoleChange?: (r: Role) => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState<Role>("customer")
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [certFile, setCertFile]       = useState<File | null>(null)
  const [idFrontFile, setIdFront]     = useState<File | null>(null)
  const [idBackFile, setIdBack]       = useState<File | null>(null)
  const [selfieFile, setSelfie]       = useState<File | null>(null)

  // Location cascade (tech)
  const [regions, setRegions]     = useState<PsgcRegion[]>([])
  const [provinces, setProvinces] = useState<PsgcProvince[]>([])
  const [cities, setCities]       = useState<PsgcCity[]>([])
  const [barangays, setBarangays] = useState<PsgcBarangay[]>([])

  const [regionCode, setRegionCode]     = useState<string>("")
  const [provinceCode, setProvinceCode] = useState<string>("")
  const [cityCode, setCityCode]         = useState<string>("")
  const [barangay, setBarangay]         = useState<string>("")

  const [services, setServices]         = useState<string[]>([])
  const [homeLat, setHomeLat]           = useState<number | null>(null)
  const [homeLng, setHomeLng]           = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const {
    register, handleSubmit, setValue, trigger, watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  })

  const passwordValue = watch("password") || ""
  const confirmValue = watch("confirmPassword") || ""
  const passwordsMismatch = confirmValue.length > 0 && passwordValue !== confirmValue

  const isTech = role === "technician"
  const totalSteps = isTech ? 4 : 2
  const stepLabels = isTech
    ? ["Account", "Certification", "Location & services", "Identity documents"]
    : ["Account", "Identity documents"]

  function selectRole(r: Role) {
    setRole(r); setValue("role", r); setStep(0); setFormError(null)
    setCertFile(null)
    onRoleChange?.(r)
  }

  // Load regions on first entry to the location step
  async function ensureRegions() {
    if (regions.length > 0) return
    try {
      const list = await getRegions()
      setRegions(list)
    } catch (e) { console.error(e) }
  }

  async function loadProvinces(rc: string) {
    try {
      const list = await getProvinces(rc)
      setProvinces(list)
      setCities([]); setBarangays([])
      setProvinceCode(""); setCityCode(""); setBarangay("")
      if (list.length === 0) {
        // Region with no provinces (e.g. Metro Manila, HUC-only)
        const cs = await getCities(rc, null)
        setCities(cs)
      }
    } catch (e) { console.error(e) }
  }

  async function loadCities(rc: string, pc: string) {
    if (!pc) return
    try {
      const list = await getCities(rc, pc)
      setCities(list)
      setCityCode(""); setBarangay("")
    } catch (e) { console.error(e) }
  }

  async function loadBarangays(cc: string) {
    try {
      const list = await getBarangays(cc)
      setBarangays(list)
      setBarangay("")
    } catch (e) { console.error(e) }
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

  async function checkEmailAvailable(value: string) {
    const email = value.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailTaken(false)
      return
    }
    setEmailChecking(true)
    try {
      const { data, error } = await supabase.rpc("is_email_registered", { email_input: email })
      if (!error) setEmailTaken(!!data)
    } catch {
      // fail silently — the signUp step is the final gate
    } finally {
      setEmailChecking(false)
    }
  }

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function onNext() {
    setFormError(null)
    if (step === 0) {
      const ok = await trigger(["firstName", "lastName", "email", "phone", "password", "confirmPassword"])
      if (!ok) return
      // Re-check on Next in case they typed fast and didn't blur
      const emailVal = watch("email") || ""
      if (emailVal) {
        setEmailChecking(true)
        const { data } = await supabase.rpc("is_email_registered", { email_input: emailVal.trim() })
        setEmailChecking(false)
        if (data) { setEmailTaken(true); return }
      }
    }
    if (isTech && step === 1) {
      const ok = await trigger(["certNumber", "certTrade"])
      if (!ok) return
      if (!certFile) { setFormError("Please upload your certificate."); return }
    }
    if (isTech && step === 2) {
      if (!regionCode) { setFormError("Please select your region."); return }
      if (provinces.length > 0 && !provinceCode) { setFormError("Please select your province."); return }
      if (!cityCode) { setFormError("Please select your city / municipality."); return }
      if (!barangay) { setFormError("Please select your barangay."); return }
      if (homeLat == null || homeLng == null) {
        setFormError("Please capture your exact location so we can match you with nearby customers.")
        return
      }
      if (services.length === 0) { setFormError("Pick at least one service."); return }
    }
    if ((!isTech && step === 1) || (isTech && step === 3)) {
      if (!idFrontFile || !idBackFile || !selfieFile) {
        setFormError("Please upload all three: ID front, ID back, and selfie.")
        return
      }
    }
    setStep(step + 1)
  }

  function onBack() {
    setFormError(null)
    setStep(Math.max(0, step - 1))
  }

  async function onSubmit(data: RegisterInput) {
    if (isTech && !certFile) { setFormError("Certificate is required."); return }
    if (isTech && services.length === 0) { setFormError("Pick at least one service."); return }
    if (isTech && (homeLat == null || homeLng == null)) {
      setFormError("Please capture your exact location."); return
    }
    if (!idFrontFile || !idBackFile || !selfieFile) {
      setFormError("ID front, back, and selfie are all required."); return
    }

    setSubmitting(true); setFormError(null)
    try {
      const [certUrl, frontUrl, backUrl, selfieUrl] = await Promise.all([
        isTech ? uploadToCloudinary(certFile!, "cert") : Promise.resolve(null),
        uploadToCloudinary(idFrontFile, "id-front"),
        uploadToCloudinary(idBackFile,  "id-back"),
        uploadToCloudinary(selfieFile,  "selfie"),
      ])

      const metadata: Record<string, unknown> = {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone,
        id_front_url: frontUrl,
        id_back_url: backUrl,
        selfie_url: selfieUrl,
      }

      if (isTech) {
        const regionName   = regions.find((r) => r.code === regionCode)?.name || ""
        const provinceName = provinces.find((p) => p.code === provinceCode)?.name || ""
        const cityName     = cities.find((c) => c.code === cityCode)?.name || ""
        metadata.cert_number = data.certNumber || null
        metadata.cert_trade = data.certTrade || null
        metadata.cert_file_url = certUrl
        metadata.home_region = regionName
        metadata.home_province = provinceName
        metadata.home_city = cityName
        metadata.home_barangay = barangay
        metadata.home_lat = homeLat != null ? String(homeLat) : null
        metadata.home_lng = homeLng != null ? String(homeLng) : null
        metadata.services = services
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: metadata },
      })
      if (authError) {
        const msg = (authError.message || "").toLowerCase()
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
          setEmailTaken(true)
          setStep(0)
          setSubmitting(false)
          return
        }
        throw authError
      }
      if (!authData.user?.id) throw new Error("Signup did not return a user")

      // Supabase returns a user with empty identities[] when the email already exists
      // (when email confirmation is ON). When OFF, authError is thrown instead.
      if (authData.user.identities && authData.user.identities.length === 0) {
        setEmailTaken(true)
        setStep(0)
        setSubmitting(false)
        return
      }

      if (!authData.session) {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
        return
      }

      router.push(isTech ? "/tech" : "/app")
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step + 1) / totalSteps) * 100

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="input-label">I am a…</label>
        <div className="seg">
          <button type="button" className={role === "customer" ? "active" : ""} onClick={() => selectRole("customer")}>
            Customer
          </button>
          <button type="button" className={role === "technician" ? "active" : ""} onClick={() => selectRole("technician")}>
            Technician
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{stepLabels[step]}</span>
        </div>
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${progress}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {/* STEP 0 — Account */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={errors.firstName?.message}>
              <input {...register("firstName")} placeholder="Juan" className="input" />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input {...register("lastName")} placeholder="Dela Cruz" className="input" />
            </Field>
          </div>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register("email", {
                onChange: () => { if (emailTaken) setEmailTaken(false) },
                onBlur: (e) => checkEmailAvailable(e.target.value),
              })}
              type="email"
              placeholder="you@example.com"
              className="input"
              style={emailTaken ? { borderColor: "var(--danger)" } : undefined}
            />
            {emailChecking && (
              <p className="text-xs text-muted mt-1">Checking…</p>
            )}
            {emailTaken && (
              <div
                className="mt-2 rounded-lg p-3 text-xs leading-relaxed"
                style={{
                  background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                  borderLeft: "3px solid var(--danger)",
                  color: "var(--ink)",
                }}
              >
                <p className="font-medium mb-1" style={{ color: "var(--danger)" }}>
                  This email is already registered.
                </p>
                <p className="text-muted">
                  If it&apos;s your account,{" "}
                  <a href="/login" className="text-accent hover:underline font-medium">log in instead</a>.
                  Otherwise, use a different email address.
                </p>
              </div>
            )}
          </Field>
          <Field label="Mobile" error={errors.phone?.message}>
            <input {...register("phone")} placeholder="09XX XXX XXXX" className="input" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink transition"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <PasswordStrength password={watch("password") || ""} />
          </Field>
          <Field label="Retype password" error={errors.confirmPassword?.message}>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink transition"
                tabIndex={-1}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {passwordsMismatch && (
              <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match.</p>
            )}
            {!passwordsMismatch && confirmValue.length > 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--success)" }}>
                Passwords match.
              </p>
            )}
          </Field>
        </div>
      )}

      {/* STEP 1 (tech) — Certification */}
      {isTech && step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            TESDA National Certificate II (NC2) in your trade is required. Admin reviews every submission.
          </p>
          <Field label="Certificate number" error={errors.certNumber?.message}>
            <input {...register("certNumber")} placeholder="NC2-AIRCON-2024-00123" className="input" />
          </Field>
          <Field label="Trade / certification" error={errors.certTrade?.message}>
            <input {...register("certTrade")} placeholder="RAC Servicing NC2 (Aircon & Ref)" className="input" />
          </Field>
          <FileField
            label="Upload certificate (PDF or image) *"
            file={certFile}
            onChange={setCertFile}
            accept="application/pdf,image/*"
          />
        </div>
      )}

      {/* STEP 2 (tech) — Location & services */}
      {isTech && step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Customers need to know where you&apos;re based and what you can fix.
          </p>

          <Field label="Region *">
            <SearchableSelect
              value={regionCode}
              onChange={(v) => { setRegionCode(v); setProvinceCode(""); setCityCode(""); setBarangay(""); loadProvinces(v) }}
              options={regions.map((r) => ({ value: r.code, label: r.name }))}
              placeholder="Select your region…"
              searchPlaceholder="Search regions…"
              onOpen={ensureRegions}
            />
          </Field>

          {regionCode && provinces.length > 0 && (
            <Field label="Province *">
              <SearchableSelect
                value={provinceCode}
                onChange={(v) => { setProvinceCode(v); loadCities(regionCode, v) }}
                options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                placeholder="Select your province…"
                searchPlaceholder="Search provinces…"
              />
            </Field>
          )}

          <Field label="City / municipality *">
            <SearchableSelect
              value={cityCode}
              onChange={(v) => { setCityCode(v); loadBarangays(v) }}
              options={cities.map((c) => ({ value: c.code, label: c.name }))}
              placeholder={
                !regionCode ? "Pick a region first" :
                provinces.length > 0 && !provinceCode ? "Pick a province first" :
                "Select your city…"
              }
              searchPlaceholder="Search cities…"
              disabled={!regionCode || (provinces.length > 0 && !provinceCode)}
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
            />
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
                    Couldn&apos;t access your location. Please allow location access in your browser and try again.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl overflow-hidden border border-line">
                {/* Success banner */}
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

                {/* Map preview */}
                <div style={{ height: 200 }}>
                  <NearbyMap
                    meLat={homeLat}
                    meLng={homeLng}
                    techs={[]}
                    height="100%"
                    hideLegend
                  />
                </div>

                {/* Coordinates */}
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
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className="relative text-sm pl-3 pr-9 py-2.5 rounded-lg border transition text-left flex items-center"
                    style={{
                      background: selected ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--surface-2)",
                      borderColor: selected ? "var(--accent)" : "var(--line-2)",
                      color: selected ? "var(--accent)" : "var(--ink)",
                      fontWeight: selected ? 500 : 400,
                    }}
                  >
                    <span className="truncate">{s}</span>
                    {selected && (
                      <span
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {services.length > 0 && (
              <p className="text-xs text-muted mt-2">{services.length} selected</p>
            )}
          </div>
        </div>
      )}

      {/* Identity docs (customer step 1, tech step 3) */}
      {((!isTech && step === 1) || (isTech && step === 3)) && (
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            We verify identity to keep FixLink safe. Upload clear photos — no glare, all corners visible.
          </p>
          <FileField label="Government ID — front *" file={idFrontFile} onChange={setIdFront} accept="image/*" />
          <FileField label="Government ID — back *"  file={idBackFile}  onChange={setIdBack}  accept="image/*" />
          <FileField label="Selfie holding your ID *" file={selfieFile} onChange={setSelfie} accept="image/*" />
        </div>
      )}

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="flex gap-2 pt-1">
        {step > 0 && (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="btn-secondary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
          >
            Back
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={onNext}
            className="btn-primary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 !py-2.5 !text-[15px] whitespace-nowrap"
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed text-center">
        By continuing, you agree to our{" "}
        <a href="/terms" target="_blank" rel="noreferrer" className="text-accent hover:underline">Terms of Service</a>{" "}
        and{" "}
        <a href="/privacy" target="_blank" rel="noreferrer" className="text-accent hover:underline">Privacy Policy</a>.
      </p>
    </form>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function FileField({
  label, file, onChange, accept,
}: {
  label: string
  file: File | null
  onChange: (f: File | null) => void
  accept: string
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="input"
      />
      {file && <p className="text-xs text-muted mt-1">Selected: {file.name}</p>}
    </div>
  )
}