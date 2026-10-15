import { chromium, FullConfig } from "@playwright/test"
import path from "path"
import fs from "fs"

const AUTH_DIR = path.join(__dirname, ".auth")
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"

const ACCOUNTS = [
  { role: "customer", email: "test-customer@fixlink.test", password: "TestPass!123" },
  { role: "tech",     email: "test-tech@fixlink.test",     password: "TestPass!123" },
]

async function loginAndSave(email: string, password: string, savePath: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" })

  // Fill email + password — try both type-based and placeholder-based locators
  const emailInput = page.locator('input[type="email"]').first()
  const passwordInput = page.locator('input[type="password"]').first()
  await emailInput.waitFor({ state: "visible", timeout: 15000 })
  await emailInput.fill(email)
  await passwordInput.fill(password)

  // Submit — button[type=submit] or a "Log in" button
  const submit = page.locator('button[type="submit"]').first()
  await submit.click()

  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 25000 })
  await page.waitForLoadState("networkidle")

  await context.storageState({ path: savePath })
  await browser.close()
}

export default async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true })

  for (const acct of ACCOUNTS) {
    const savePath = path.join(AUTH_DIR, `${acct.role}.json`)
    await loginAndSave(acct.email, acct.password, savePath)
    console.log(`[global-setup] saved auth state for ${acct.role}`)
  }
}
