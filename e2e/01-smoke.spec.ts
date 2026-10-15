import { test, expect } from '@playwright/test'

test.describe('Smoke — app is up', () => {
  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Create your account')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /log in/i }).first()).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText('FixLink').first()).toBeVisible()
  })
})
