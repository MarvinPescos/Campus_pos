// With Vite running: npx --package @playwright/cli playwright-cli open http://127.0.0.1:5179
// Then: npx --package @playwright/cli playwright-cli run-code --filename scripts/check-payment.js
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  async function cashIs(amount) {
    const displayed = await page.getByLabel('Cash Tendered', { exact: true }).textContent()
    if (displayed !== `₱${amount}`) throw new Error(`Expected cash ₱${amount}, got ${displayed}`)
  }
  const key = (name) => page.getByRole('button', { name, exact: true })
  await page.route('**/api/products', (route) => route.fulfill({ json: [
    { id: 'coffee', name: 'Coffee', price: 25, icon: '☕' },
    { id: 'water', name: 'Water', price: 15, icon: '💧' },
  ] }))
  await page.route('**/api/transactions', (route) => route.fulfill({
    status: 422, json: { detail: 'Payment rejected for this check.' },
  }))
  await page.reload()
  await page.getByRole('button', { name: /Coffee ₱25/ }).click()
  await page.getByRole('button', { name: /Coffee ₱25/ }).click()
  await page.getByRole('button', { name: /Water ₱15/ }).click()
  await page.getByRole('button', { name: 'Proceed', exact: true }).click()
  await page.getByRole('button', { name: 'Proceed', exact: true }).click()
  await page.getByRole('button', { name: 'Cash', exact: true }).waitFor({ timeout: 2000 })
  for (const method of ['Cash', 'QR', 'Card']) {
    if (!(await page.getByRole('button', { name: method, exact: true }).isEnabled())) {
      throw new Error(`${method} must be selectable`)
    }
  }
  await page.getByRole('button', { name: 'Cash', exact: true }).click()
  await page.getByText('₱65 more needed', { exact: true }).waitFor()
  if (!(await page.getByRole('button', { name: 'Confirm', exact: true }).isDisabled())) {
    throw new Error('Insufficient cash must disable Confirm')
  }
  await key('0').click()
  await key('00').click()
  await cashIs(0)
  for (const digit of '1234567890') await key(digit).click()
  await cashIs(1234567890)
  await key('Backspace').click()
  await cashIs(123456789)
  await key('Clear').click()
  await key('Backspace').click()
  await cashIs(0)
  await key('6').click()
  await key('4').click()
  await page.getByText('₱1 more needed', { exact: true }).waitFor()
  if (!(await key('Confirm').isDisabled())) throw new Error('₱64 cannot pay a ₱65 Order')
  await key('Backspace').click()
  await key('5').click()
  await page.getByText('Change: ₱0', { exact: true }).waitFor()
  if (!(await key('Confirm').isEnabled())) throw new Error('Exact cash must enable Confirm')
  await key('Clear').click()
  await key('1').click()
  await key('00').click()
  await cashIs(100)
  await page.getByText('Change: ₱35', { exact: true }).waitFor()
  await key('Back').click()
  await key('Cash').click()
  await cashIs(0)
  await page.getByText('₱65 more needed', { exact: true }).waitFor()
  await key('Back').click()
  for (const method of ['QR', 'Card']) {
    await key(method).click()
    await page.getByRole('heading', { name: `${method} payment`, exact: true }).waitFor()
    await key('Back').click()
  }
  await key('Back').click()
  await page.getByRole('heading', { name: 'Order Summary', exact: true }).waitFor()
  await page.getByText('2 × ₱25 = ₱50', { exact: true }).waitFor()
  await page.getByText('1 × ₱15 = ₱15', { exact: true }).waitFor()
  await key('Proceed').click()
  await key('Cash').click()
  await cashIs(0)
  for (const digit of '9007199254740991') await key(digit).click()
  await cashIs(9007199254740991)
  if (!(await key('0').isDisabled())) throw new Error('Unsafe cash must be blocked')
  await key('Clear').click()
  await page.getByText('₱65 more needed', { exact: true }).waitFor()
  await key('1').click()
  await key('00').click()
  await key('Confirm').click()
  await page.getByRole('alert').getByText('Payment rejected for this check.', { exact: true }).waitFor()
  await cashIs(100)
  await key('Back').click()
  await key('Cash').click()
  await cashIs(0)
  return 'Passed: all keypad keys, insufficient/exact/excess cash, safe integer limit, Back/reset, intact Order, method choices, Confirm handoff'
}
