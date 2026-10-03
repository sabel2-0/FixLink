export type UploadKind = "cert" | "id-front" | "id-back" | "selfie"

export async function uploadToCloudinary(file: File, kind: UploadKind): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const preset    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    throw new Error("Cloudinary env vars missing — check .env.local")
  }

  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", preset)
  form.append("folder", `fixlink/uploads/${kind}`)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.secure_url as string
}