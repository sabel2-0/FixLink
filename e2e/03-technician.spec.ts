import { test, expect } from "@playwright/test"

test.use({ storageState: "e2e/.auth/tech.json" })

test.describe("Technician portal", () => {
  test("can reach /tech dashboard", async ({ page }) => {
    await page.goto("/tech")
    await expect(page).toHaveURL(/\/tech(\/|$)/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("can open Jobs page", async ({ page }) => {
    await page.goto("/tech/schedule")
    await expect(page.getByText(/Jobs/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can open Estimates page", async ({ page }) => {
    await page.goto("/tech/estimates")
    await expect(page.getByText(/Estimates/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("can open Wallet page", async ({ page }) => {
    await page.goto("/tech/wallet")
    await expect(page.getByText(/Wallet/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test("wallet shows test balance", async ({ page }) => {
    await page.goto("/tech/wallet")
    // ₱10,000 was seeded
    await expect(page.getByText(/10,000/)).toBeVisible({ timeout: 10_000 })
  })
})
