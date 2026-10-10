import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('cars can be added and removed live, with no console errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Yurei Jam' })
  ).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()

  const density = page.locator('dl dd').first()
  await expect(density).toContainText('30')

  const add = page.getByRole('button', { name: 'Add car', exact: true })
  await add.click()
  await add.click()
  await add.click()
  await expect(density).toContainText('33')

  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(density).toContainText('32')

  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(density).toContainText('30') // reset starts over at 30 cars

  expect(errors).toEqual([])
})

test('has no serious or critical accessibility violations', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  )
  expect(
    serious.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`
    )
  ).toEqual([])
})
