import { test, expect } from "@playwright/test"

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CUSTOMER_EMAIL = "test-customer@fixlink.test"
const TECH_NAME = "Test Tech"

async function resetCustomerBookings() {
  const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" }
  const r = await fetch(`${SB_URL}/rest/v1/profiles?email=eq.${CUSTOMER_EMAIL}&select=id`, { headers: h })
  const rows = await r.json()
  const id = rows[0]?.id
  if (!id) return
  await fetch(
    `${SB_URL}/rest/v1/bookings?customer_id=eq.${id}&status=in.(pending,estimated,confirmed,en_route,arrived,in_progress,quote_pending,awaiting_confirmation)`,
    { method: "DELETE", headers: h }
  )
}

test.use({
  storageState: "e2e/.auth/customer.json",
  permissions: ["geolocation"],
  geolocation: { latitude: 10.2522, longitude: 123.9491 },
})

test.describe.serial("Customer booking flow", () => {
  test.beforeAll(async () => {
    await resetCustomerBookings()
  })

  test("customer completes the full booking wizard end-to-end", async ({ page }) => {
    await page.goto("/app/book", { waitUntil: "domcontentloaded" })

    // Guard: if the "already have an active booking" block shows, skip
    const blocked = await page
      .getByRole("heading", { name: /already have an active booking/i })
      .isVisible()
      .catch(() => false)
    test.skip(blocked, "Customer already has an active booking (reset failed?)")

    // ── Step 1: pick Aircon ──
    await expect(page.getByRole("heading", { name: /What needs fixing/i })).toBeVisible({ timeout: 15_000 })
    await page.locator(".appliance-tile").filter({ hasText: "Aircon" }).first().click()
    await page.getByRole("button", { name: /^Next$/ }).click()

    // ── Step 2: pick a problem ──
    await expect(page.getByRole("heading", { name: /What is wrong with each/i })).toBeVisible({ timeout: 10_000 })
    await page.locator(".problem-checkbox").first().click()
    await page.getByRole("button", { name: /^Next$/ }).click()

    // ── Step 3: location, date, time ──
    await expect(page.getByRole("heading", { name: /Where and when/i })).toBeVisible({ timeout: 10_000 })

    const detectBtn = page.getByRole("button", { name: /Detect my location/i })
    if (await detectBtn.isVisible().catch(() => false)) {
      await detectBtn.click()
      await page.waitForTimeout(500)
    }

    const futureDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    await page.locator('input[type="date"]').fill(futureDate)
    await page.locator('input[type="time"]').fill("14:00")
    await page.getByRole("button", { name: /^Next$/ }).click()

    // ── Step 4: pick the test technician ──
    await expect(page.getByRole("heading", { name: /Pick technicians/i })).toBeVisible({ timeout: 10_000 })

    const techButton = page.locator("button").filter({ hasText: TECH_NAME }).first()
    await techButton.waitFor({ state: "visible", timeout: 20_000 })
    await techButton.click()

    // ── Submit ──
    await page.getByRole("button", { name: /Request estimates/i }).click()
    await expect(page.getByText(/Confirm your request/i)).toBeVisible({ timeout: 10_000 })
    await page.getByRole("button", { name: /Send request/i }).click()

    // ── Verify ──
    await page.waitForURL(/\/app\/bookings/, { timeout: 20_000 })
    await expect(page.getByText("Aircon").first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
