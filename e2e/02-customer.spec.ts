import { test, expect } from "@playwright/test"

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CUSTOMER_EMAIL = "test-customer@fixlink.test"

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

test.use({ storageState: "e2e/.auth/customer.json" })

test.describe("Customer portal", () => {
  test.beforeAll(async () => {
    await resetCustomerBookings()
  })

  test("can reach /app dashboard", async ({ page }) => {
    await page.goto("/app")
    await expect(page).toHaveURL(/\/app(\/|$)/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("can open the booking wizard", async ({ page }) => {
    await page.goto("/app/book")
    await expect(page.getByText(/What needs fixing/i)).toBeVisible({ timeout: 10_000 })
  })

  test("can navigate to bookings list", async ({ page }) => {
    await page.goto("/app/bookings")
    await expect(page.getByText(/bookings/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can open messages page", async ({ page }) => {
    await page.goto("/app/messages")
    await expect(page.getByText(/messages/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
