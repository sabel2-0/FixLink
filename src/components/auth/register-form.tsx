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
import { SERVICES } from "@/lib/booking/constants"
import { SiteName } from "@/components/shared/SiteNameProvider"

type Role = "customer" | "technician"
type VerificationPath = "tesda" | "employed" | "self_employed" | "freelance"
type Reference = { name: string; phone: string; service: string; job_date: string }
const EMPTY_REF: Reference = { name: "", phone: "", service: "", job_date: "" }



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

  // Multi-path verification state
  const [verificationPath, setVerificationPath] = useState<VerificationPath | null>(null) // deprecated
  const [proofs, setProofs] = useState<{ tesda: boolean; employed: boolean; self_employed: boolean; freelance: boolean }>({
    tesda: false, employed: false, self_employed: false, freelance: false,
  })
  function toggleProof(k: "tesda" | "employed" | "self_employed" | "freelance") {
    setProofs((p) => ({ ...p, [k]: !p[k] }))
  }
  const [coeFile, setCoeFile]                   = useState<File | null>(null)
  const [employerName, setEmployerName]         = useState("")
  const [positionHeld, setPositionHeld]         = useState("")
  const [selfEmployedDocType, setSelfEmployedDocType] = useState<"dti" | "bir" | "mayor" | null>(null)
  const [selfEmployedFile, setSelfEmployedFile] = useState<File | null>(null)
  const [fbPageUrl, setFbPageUrl]               = useState("")
  const [refs, setRefs]                         = useState<Reference[]>([{ ...EMPTY_REF }, { ...EMPTY_REF }, { ...EMPTY_REF }])
  const [yearsExperience, setYearsExperience]   = useState("")
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
  const [serviceCategory, setServiceCategory] = useState<"appliance" | "device">("appliance")
  const [homeLat, setHomeLat]           = useState<number | null>(null)
  const [homeLng, setHomeLng]           = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const {
    register, handleSubmit, setValue, trigger, watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as any,
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
    const email = value.trim().toLowerCase()
    // Never reveal whether reserved admin addresses exist
    if (email.endsWith("@local.com")) {
      setEmailTaken(false)
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailTaken(false)
      return
    }
    setEmailChecking(true)
    try {
      const { data, error } = await supabase.rpc("is_email_registered", { email_input: email })
      if (!error) setEmailTaken(!!data)
    } catch {
      // silent — signUp on submit is the final gate
    } finally {
      setEmailChecking(false)
    }
  }

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function updateRef(i: number, field: keyof Reference, value: string) {
    setRefs((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  async function onNext() {
    setFormError(null)
    if (step === 0) {
      const ok = await trigger(["firstName", "lastName", "email", "phone", "password", "confirmPassword"])
      if (!ok) return
      const emailVal = (watch("email") || "").trim().toLowerCase()
      if (emailVal && !emailVal.endsWith("@local.com")) {
        setEmailChecking(true)
        const { data } = await supabase.rpc("is_email_registered", { email_input: emailVal })
        setEmailChecking(false)
        if (data) { setEmailTaken(true); return }
      }

    }
    if (isTech && step === 1) {
      const any = proofs.tesda || proofs.employed || proofs.self_employed || proofs.freelance
      if (!any) { setFormError("Check at least one way you can verify your experience."); return }
      if (!yearsExperience || Number(yearsExperience) < 0) {
        setFormError("Enter your years of experience."); return
      }
      if (proofs.tesda) {
        const ok = await trigger(["certNumber", "certTrade"])
        if (!ok) return
        if (!certFile) { setFormError("Upload your TESDA certificate."); return }
      }
      if (proofs.employed) {
        if (!employerName.trim()) { setFormError("Enter your previous employer."); return }
        if (!positionHeld.trim()) { setFormError("Enter your position."); return }
        if (!coeFile) { setFormError("Upload your Certificate of Employment."); return }
      }
      if (proofs.self_employed) {
        if (!selfEmployedDocType) { setFormError("Pick which self-employment document you'll upload."); return }
        if (!selfEmployedFile) { setFormError("Upload the selected document."); return }
      }
      if (proofs.freelance) {
        if (!fbPageUrl.trim()) { setFormError("Enter your Facebook Page URL."); return }
        const first = refs[0]
        if (!first.name.trim() || !first.phone.trim() || !first.service.trim()) {
          setFormError("Provide at least 1 complete customer reference."); return
        }
      }
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
      const deviceSelected = services.some((s) => SERVICES.find((x) => x.label === s)?.category === "device")
      if (deviceSelected && !proofs.tesda) { setFormError("Device repair requires TESDA CSS NC II. Go back, check the TESDA proof, and provide your certificate."); return }
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
    if (isTech && !(proofs.tesda || proofs.employed || proofs.self_employed || proofs.freelance)) { setFormError("Choose at least one verification method."); return }
    if (isTech && services.length === 0) { setFormError("Pick at least one service."); return }
    if (isTech && (homeLat == null || homeLng == null)) {
      setFormError("Please capture your exact location."); return
    }
    if (!idFrontFile || !idBackFile || !selfieFile) {
      setFormError("ID front, back, and selfie are all required."); return
    }

    setSubmitting(true); setFormError(null)
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFrontFile, "id-front"),
        uploadToCloudinary(idBackFile,  "id-back"),
        uploadToCloudinary(selfieFile,  "selfie"),
      ])

      let certUrl: string | null = null
      let coeUrl: string | null = null
      let dtiUrl: string | null = null
      let birUrl: string | null = null
      let mayorUrl: string | null = null

      if (isTech) {
        const tasks: Promise<void>[] = []
        if (proofs.tesda && certFile) {
          tasks.push(uploadToCloudinary(certFile, "cert").then((u) => { certUrl = u }))
        }
        if (proofs.employed && coeFile) {
          tasks.push(uploadToCloudinary(coeFile, "coe").then((u) => { coeUrl = u }))
        }
        if (proofs.self_employed && selfEmployedFile) {
          const kind = selfEmployedDocType === "dti" ? "dti" : selfEmployedDocType === "bir" ? "bir" : "mayor"
          tasks.push(uploadToCloudinary(selfEmployedFile, kind).then((u) => {
            if (kind === "dti") dtiUrl = u
            else if (kind === "bir") birUrl = u
            else mayorUrl = u
          }))
        }
        await Promise.all(tasks)
      }

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

        const proofsArr: string[] = []
        if (proofs.tesda) proofsArr.push("tesda")
        if (proofs.employed) proofsArr.push("employed")
        if (proofs.self_employed) proofsArr.push("self_employed")
        if (proofs.freelance) proofsArr.push("freelance")

        metadata.verification_proofs = proofsArr
        metadata.verification_path = proofsArr[0] || null
        metadata.years_experience = Number(yearsExperience) || 0
        metadata.cert_number = proofs.tesda ? (data.certNumber || null) : null
        metadata.cert_trade = proofs.tesda ? (data.certTrade || null) : null
        metadata.cert_file_url = certUrl
        metadata.coe_url = coeUrl
        metadata.dti_url = dtiUrl
        metadata.bir_url = birUrl
        metadata.mayor_url = mayorUrl
        metadata.employer_name = proofs.employed ? (employerName.trim() || null) : null
        metadata.position_held = proofs.employed ? (positionHeld.trim() || null) : null
        metadata.facebook_page_url = proofs.freelance ? (fbPageUrl.trim() || null) : null
        metadata.reference_contacts = proofs.freelance
          ? refs.filter((r) => r.name.trim() && r.phone.trim())
          : []
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
              <p className="text-xs text-muted mt-1">Checking...</p>
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

      {/* STEP 1 (tech) — Verification proofs (multi-select) */}
      {isTech && step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Check all the ways you can verify your repair experience. Admin reviews every submission.
          </p>

          {/* TESDA */}
          <div className="rounded-lg border border-line p-3" style={{ background: "var(--surface-2)" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={proofs.tesda} onChange={() => toggleProof("tesda")} className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent)" }} />
              <span className="flex-1">
                <span className="text-sm font-medium text-ink block">TESDA NC2</span>
                <span className="text-[11px] text-muted block mt-0.5">Government-issued trade certification</span>
              </span>
            </label>
            {proofs.tesda && (
              <div className="space-y-3 mt-3 pt-3 border-t border-line">
                <Field label="Certificate number" error={errors.certNumber?.message}>
                  <input {...register("certNumber")} placeholder="NC2-AIRCON-2024-00123" className="input" />
                </Field>
                <Field label="Trade / certification" error={errors.certTrade?.message}>
                  <input {...register("certTrade")} placeholder="RAC Servicing NC2 (Aircon & Ref)" className="input" />
                </Field>
                <FileField label="Upload certificate *" file={certFile} onChange={setCertFile} accept="application/pdf,image/*" />
              </div>
            )}
          </div>

          {/* Employed */}
          <div className="rounded-lg border border-line p-3" style={{ background: "var(--surface-2)" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={proofs.employed} onChange={() => toggleProof("employed")} className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent)" }} />
              <span className="flex-1">
                <span className="text-sm font-medium text-ink block">Employed / Previously employed</span>
                <span className="text-[11px] text-muted block mt-0.5">Certificate of Employment from a former employer</span>
              </span>
            </label>
            {proofs.employed && (
              <div className="space-y-3 mt-3 pt-3 border-t border-line">
                <Field label="Previous employer *">
                  <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="input" placeholder="ABC Repair Shop" />
                </Field>
                <Field label="Position held *">
                  <input value={positionHeld} onChange={(e) => setPositionHeld(e.target.value)} className="input" placeholder="Aircon Technician" />
                </Field>
                <FileField label="Upload Certificate of Employment *" file={coeFile} onChange={setCoeFile} accept="application/pdf,image/*" />
              </div>
            )}
          </div>

          {/* Self-employed */}
          <div className="rounded-lg border border-line p-3" style={{ background: "var(--surface-2)" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={proofs.self_employed} onChange={() => toggleProof("self_employed")} className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent)" }} />
              <span className="flex-1">
                <span className="text-sm font-medium text-ink block">Self-employed</span>
                <span className="text-[11px] text-muted block mt-0.5">DTI registration, BIR 2303, or Mayor's permit</span>
              </span>
            </label>
            {proofs.self_employed && (
              <div className="space-y-3 mt-3 pt-3 border-t border-line">
                <Field label="Which document will you upload? *">
                  <div className="grid grid-cols-3 gap-2">
                    {(["dti", "bir", "mayor"] as const).map((d) => {
                      const sel = selfEmployedDocType === d
                      return (
                        <button key={d} type="button" onClick={() => setSelfEmployedDocType(d)}
                          className="rounded-lg border p-2 text-xs font-medium text-center transition"
                          style={{
                            background: sel ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--surface)",
                            borderColor: sel ? "var(--accent)" : "var(--line-2)",
                            color: sel ? "var(--accent)" : "var(--ink)",
                          }}>
                          {d === "dti" ? "DTI" : d === "bir" ? "BIR 2303" : "Mayor's Permit"}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <FileField label="Upload document *" file={selfEmployedFile} onChange={setSelfEmployedFile} accept="application/pdf,image/*" />
              </div>
            )}
          </div>

          {/* Freelance */}
          <div className="rounded-lg border border-line p-3" style={{ background: "var(--surface-2)" }}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={proofs.freelance} onChange={() => toggleProof("freelance")} className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent)" }} />
              <span className="flex-1">
                <span className="text-sm font-medium text-ink block">Freelance</span>
                <span className="text-[11px] text-muted block mt-0.5">Active Facebook page + customer references</span>
              </span>
            </label>
            {proofs.freelance && (
              <div className="space-y-3 mt-3 pt-3 border-t border-line">
                <Field label="Facebook Page URL *">
                  <input value={fbPageUrl} onChange={(e) => setFbPageUrl(e.target.value)} className="input" placeholder="https://facebook.com/yourpage" />
                </Field>
                <p className="text-[11px] text-muted leading-relaxed">
                  Page must be 6+ months old with 10+ reviews. Admin will verify it directly.
                </p>
                <div className="space-y-2">
                  <p className="input-label">Customer references (provide at least 1)</p>
                  {refs.map((r, i) => (
                    <div key={i} className="rounded-lg border border-line p-3 space-y-2" style={{ background: "var(--surface)" }}>
                      <p className="text-xs font-medium text-ink">Reference {i + 1}</p>
                      <input value={r.name} onChange={(e) => updateRef(i, "name", e.target.value)} className="input text-sm" placeholder="Customer name" />
                      <input value={r.phone} onChange={(e) => updateRef(i, "phone", e.target.value)} className="input text-sm" placeholder="Phone number" />
                      <input value={r.service} onChange={(e) => updateRef(i, "service", e.target.value)} className="input text-sm" placeholder="What you fixed (e.g. Aircon cleaning)" />
                      <input value={r.job_date} onChange={(e) => updateRef(i, "job_date", e.target.value)} className="input text-sm" placeholder="When (e.g. August 2025)" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Field label="Total years of experience in repair *">
              <input type="number" min="0" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="input" placeholder="e.g. 3" />
            </Field>
          </div>
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
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <label className="input-label" style={{ marginBottom: 0 }}>
                {serviceCategory === "appliance" ? "Appliances you can fix *" : "Devices you can fix *"}
              </label>
              <div className="seg" style={{ maxWidth: 260 }}>
                <button type="button" className={serviceCategory === "appliance" ? "active" : ""} onClick={() => setServiceCategory("appliance")}>Appliances</button>
                <button type="button" className={serviceCategory === "device" ? "active" : ""} onClick={() => { setServiceCategory("device"); if (!proofs.tesda) setProofs((p) => ({ ...p, tesda: true })) }}>Devices</button>
              </div>
            </div>

            {serviceCategory === "device" && (
              <p className="text-xs text-muted mb-3 leading-relaxed">
                Device repair requires TESDA CSS NC II. We auto-checked the TESDA proof above — provide your certificate number and trade in the previous step.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {SERVICES.filter((s) => s.category === serviceCategory).map((s) => {
                const selected = services.includes(s.label)
                return (
                  <button key={s.id} type="button" onClick={() => toggleService(s.label)} className="relative text-sm pl-3 pr-9 py-2.5 rounded-lg border transition text-left flex items-center" style={{ background: selected ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--surface-2)", borderColor: selected ? "var(--accent)" : "var(--line-2)", color: selected ? "var(--accent)" : "var(--ink)", fontWeight: selected ? 500 : 400 }}>
                    <span className="truncate">{s.label}</span>
                    {selected && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)", color: "#fff" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>
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
            We verify identity to keep <SiteName /> safe. Upload clear photos — no glare, all corners visible.
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
