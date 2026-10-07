// With Vite running and a playwright-cli browser open:
// npx --package @playwright/cli playwright-cli run-code --filename scripts/check-receipt.js
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  const button = (name) => page.getByRole('button', { name, exact: true })
  let receipt
  const requests = []
  await page.route('**/api/products', (route) => route.fulfill({ json: [
    { id: 'coffee', name: 'Coffee', price: 25, icon: '☕' },
    { id: 'tea', name: 'Tea', price: 20, icon: '🍵' },
  ] }))
  await page.route('**/api/transactions', (route) => {
    requests.push(route.request().postDataJSON())
    return route.fulfill({ status: 201, json: receipt })
  })

  for (const method of ['Cash', 'QR', 'Card']) {
    for (const resetFrom of ['Payment Successful', 'Receipt']) {
      // Server values deliberately differ from the catalog to catch reconstructed receipts.
      receipt = {
        reference: 'TXN-20261007-ABC123', storeName: 'Campus Test Café',
        createdAt: '2026-01-15T09:30:00', paymentMethod: method.toLowerCase(), total: 82,
        lines: [
          { productId: 'coffee', name: 'Server Coffee', quantity: 2, price: 31, subtotal: 62 },
          { productId: 'tea', name: 'Server Tea', quantity: 1, price: 20, subtotal: 20 },
        ],
        ...(method === 'Cash' ? { cashTendered: 100, change: 18 } : {}),
      }
      await page.reload()
      await page.getByRole('button', { name: /Coffee ₱25/ }).click({ clickCount: 2 })
      await page.getByRole('button', { name: /Tea ₱20/ }).click()
      await button('Proceed').click()
      await button('Proceed').click()
      await button(method).click()
      if (method === 'Cash') {
        await button('1').click()
        await button('00').click()
      }
      await button(method === 'Cash' ? 'Confirm' : method === 'QR' ? 'Simulate Customer Paid' : 'Tap / Insert Card').click()
      await page.getByRole('heading', { name: 'Payment Successful', exact: true }).waitFor()
      await button('View Receipt').waitFor({ timeout: 3000 })
      if (resetFrom === 'Receipt') {
        await button('View Receipt').click()
        await page.getByRole('heading', { name: 'Receipt', exact: true }).waitFor()
        await Promise.all(['Campus Test Café', 'Transaction Reference', receipt.reference, 'Payment Method', method,
          'Server Coffee', '2 × ₱31', 'Subtotal: ₱62', 'Server Tea', '1 × ₱20', 'Subtotal: ₱20', '₱82']
          .map((text) => page.getByText(text, { exact: true }).waitFor()))
        const time = page.locator('time')
        if (await time.getAttribute('datetime') !== receipt.createdAt) throw new Error('Receipt must use server createdAt')
        const expectedDate = await page.evaluate((date) => new Date(date).toLocaleString(), receipt.createdAt)
        if (await time.textContent() !== expectedDate) throw new Error('Receipt must show server date/time')
        if (await button('Back').count()) throw new Error('Receipt must have no Back button')
        if (method === 'Cash') {
          await Promise.all(['Cash Tendered', '₱100', 'Change', '₱18']
            .map((text) => page.getByText(text, { exact: true }).waitFor()))
        } else if (await page.getByText('Cash Tendered', { exact: true }).count() || await page.getByText('Change', { exact: true }).count()) {
          throw new Error('QR/Card must omit cash details')
        }
      }
      const requestCount = requests.length
      await button('New Transaction').click()
      await page.getByRole('heading', { name: 'Item Selection', exact: true }).waitFor()
      await page.getByText('No items yet — tap a product', { exact: true }).waitFor()
      if (!(await button('Proceed').isDisabled())) throw new Error('Reset must clear the Order')
      if (await page.getByText(receipt.reference, { exact: true }).count() || await button('View Receipt').count()) {
        throw new Error('Reset must remove the previous Receipt')
      }
      await page.getByRole('button', { name: /Tea ₱20/ }).click()
      await button('Proceed').click()
      await button('Proceed').click()
      await page.getByRole('heading', { name: 'Choose a Payment Method', exact: true }).waitFor()
      await button('Cash').click()
      if (await page.getByLabel('Cash Tendered', { exact: true }).textContent() !== '₱0') throw new Error('Reset must clear Cash Tendered')
      if (!(await button('Confirm').isDisabled())) throw new Error('Old cash must not confirm a new Order')
      if (requests.length !== requestCount) throw new Error('Receipt and reset must not resubmit payment')
    }
  }
  return 'Passed: server Receipt fields, Cash/QR/Card, both New Transaction actions, empty Order/method/cash, no Back or extra checkout'
}
