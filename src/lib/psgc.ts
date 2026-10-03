const BASE = "https://psgc.gitlab.io/api"

export type PsgcRegion     = { code: string; name: string; regionName: string }
export type PsgcProvince   = { code: string; name: string; regionCode: string }
export type PsgcCity       = { code: string; name: string; provinceCode?: string | null; regionCode: string }
export type PsgcBarangay   = { code: string; name: string }

const cache = new Map<string, unknown>()

async function getJson<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PSGC fetch failed: ${res.status}`)
  const data = (await res.json()) as T
  cache.set(url, data)
  return data
}

export function getRegions() {
  return getJson<PsgcRegion[]>(`${BASE}/regions/`)
}

export function getProvinces(regionCode: string) {
  return getJson<PsgcProvince[]>(`${BASE}/regions/${regionCode}/provinces/`)
}

export async function getCities(regionCode: string, provinceCode?: string | null) {
  if (provinceCode) {
    return getJson<PsgcCity[]>(`${BASE}/provinces/${provinceCode}/cities-municipalities/`)
  }
  // Cities in a region that don't belong to a province (e.g. Metro Manila, HUCs)
  const all = await getJson<PsgcCity[]>(`${BASE}/regions/${regionCode}/cities-municipalities/`)
  return all
}

export async function getBarangays(cityCode: string) {
  const list = await getJson<PsgcBarangay[]>(`${BASE}/cities-municipalities/${cityCode}/barangays/`)
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

// PH bounding box (rough — enough to reject foreign coords)
export function isInPhilippines(lat: number, lng: number) {
  return lat >= 4.5 && lat <= 21.5 && lng >= 116 && lng <= 127
}