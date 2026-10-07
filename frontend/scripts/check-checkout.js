// With Vite running and a playwright-cli browser open:
// npx --package @playwright/cli playwright-cli run-code --filename scripts/check-checkout.js
async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  const button = (name) => page.getByRole('button', { name, exact: true })
  const products = [{ id: 'coffee', name: 'Coffee', price: 25, icon: '☕' }]
  const requests = []
  let response = 'success'
  let release
  let started
  let elapsed
  await page.route('**/api/products', (route) => route.fulfill({ json: products }))
  await page.route('**/api/transactions', async (route) => {
    const request = route.request().postDataJSON()
    requests.push(request)
    elapsed = Date.now() - started
    if (response === 'network') return route.abort('failed')
    if (response === 'reject') return route.fulfill({ status: 422, json: { detail: 'Insufficient cash: ₱40 more needed' } })
    if (response === 'server') return route.fulfill({ status: 500, body: 'Service unavailable' })
    if (response === 'malformed') return route.fulfill({ status: 201, json: { reference: 'TXN-20261007-ABC123' } })
    await new Promise((resolve) => { release = resolve })
    await route.fulfill({ status: 201, json: {
      reference: 'TXN-20261007-ABC123', storeName: 'IT415 Café',
      createdAt: '2026-10-07T20:00:00', paymentMethod: request.paymentMethod, total: 25,
      ...(request.paymentMethod === 'cash' ? { cashTendered: 100, change: 75 } : {}),
      lines: [{ productId: 'coffee', name: 'Coffee', quantity: 1, price: 25, subtotal: 25 }],
    } })
  })

  async function openPayment(method) {
    await page.reload()
    await page.getByRole('button', { name: /Coffee ₱25/ }).click()
    await button('Proceed').click()
    await button('Proceed').click()
    await button(method).click()
    if (method === 'Cash') {
      await button('1').click()
      await button('00').click()
    }
  }

  async function pay(method) {
    const submit = method === 'Cash' ? 'Confirm' : method === 'QR' ? 'Simulate Customer Paid' : 'Tap / Insert Card'
    const requestArrived = page.waitForRequest('**/api/transactions')
    started = Date.now()
    // Two rapid public-button activations exercise the duplicate-submission guard.
    await button(submit).evaluate((control) => { control.click(); control.click() })
    await requestArrived
  }

  for (const method of ['Cash', 'QR', 'Card']) {
    requests.length = 0
    response = 'success'
    await openPayment(method)
    if (method === 'QR') await page.getByRole('img', { name: 'Simulated QR payment for ₱25' }).waitFor()
    await pay(method)
    await page.getByText('Processing…', { exact: true }).waitFor()
    if (!(await button('Back').isDisabled())) throw new Error('Back must be disabled during checkout')
    if (await page.getByRole('heading', { name: 'Payment Successful', exact: true }).count()) {
      throw new Error('No success before the backend responds')
    }
    if (requests.length !== 1) throw new Error(`${method} must submit exactly once`)
    if (method !== 'Cash' && elapsed < 1400) throw new Error(`${method} must wait about 1.5 seconds before POST`)
    if (method === 'Cash' && elapsed >= 1400) throw new Error('Cash must POST without the simulation delay')
    const expected = {
      lines: [{ productId: 'coffee', quantity: 1 }], paymentMethod: method.toLowerCase(),
      ...(method === 'Cash' ? { cashTendered: 100 } : {}),
    }
    if (JSON.stringify(requests[0]) !== JSON.stringify(expected)) throw new Error(`Incorrect ${method} request`)
    release()
    await page.getByRole('heading', { name: 'Payment Successful', exact: true }).waitFor()
    await page.getByText('TXN-20261007-ABC123', { exact: true }).waitFor()
    if (await button('Back').count()) throw new Error('Success must have no Back button')
  }

  for (const failure of ['reject', 'network', 'server', 'malformed']) {
    response = failure
    await openPayment('Cash')
    await pay('Cash')
    const message = failure === 'reject' ? 'Insufficient cash: ₱40 more needed'
      : failure === 'network' ? 'Unable to reach the payment service. Please try again.'
      : failure === 'server' ? 'Payment failed. Please try again.'
      : 'The payment response is incomplete. Please check the transaction before retrying.'
    await page.getByRole('alert').getByText(message, { exact: true }).waitFor()
    if (await page.getByLabel('Cash Tendered', { exact: true }).textContent() !== '₱100') {
      throw new Error(`${failure} must keep Cash Tendered`)
    }
    if (!(await button('Back').isEnabled()) || !(await button('Try Again').isEnabled())) {
      throw new Error(`${failure} must allow Back and Try Again`)
    }
    response = 'success'
    const requestArrived = page.waitForRequest('**/api/transactions')
    await button('Try Again').click()
    await requestArrived
    const retry = requests[requests.length - 1]
    if (retry.lines[0].quantity !== 1 || retry.cashTendered !== 100) throw new Error('Retry must keep the Order and cash')
    release()
    await page.getByRole('heading', { name: 'Payment Successful', exact: true }).waitFor()
  }

  for (const method of ['QR', 'Card']) {
    response = 'network'
    await openPayment(method)
    await pay(method)
    await page.getByRole('alert').waitFor()
    await page.getByRole('heading', { name: `${method} payment`, exact: true }).waitFor()
    if (!(await button('Try Again').isEnabled())) throw new Error(`${method} failure must allow retry`)
    await button('Back').click()
    await button('Back').click()
    await page.getByText('1 × ₱25 = ₱25', { exact: true }).waitFor()
  }
  return 'Passed: Cash/QR/Card payloads, simulation timing, processing lock, duplicate guard, success only after backend response, failures and retries preserving Order/method/cash'
}
