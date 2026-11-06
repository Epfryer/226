import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const item = { syncVariantId: 7, variantId: 77, name: "Browser test print", quantity: 2, price: 30, color: "Black", size: "M", image: "" };
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/shop/products", route => route.fulfill({ json: { result: [] } }));
    await page.route("**/api/shop/status", route => route.fulfill({ json: { ready: true, testMode: true, message: "Test checkout only. No physical products will be ordered." } }));
    await page.goto(base + "/studio");
    await page.evaluate(item => localStorage.setItem("def-studio-cart-v1", JSON.stringify([item])), item);
    await page.reload();
    await page.getByRole("button", { name: "Open cart" }).click();
    await page.getByRole("button", { name: "Proceed to Checkout" }).click();
    await page.getByRole("heading", { name: "Shipping details", exact: true }).waitFor();
    const dialog = page.getByRole("dialog", { name: "Shipping details", exact: true });
    await dialog.getByLabel("Full name", { exact: true }).fill("Test Shopper");
    await dialog.getByLabel("Email address").fill("shopper@example.test");
    await dialog.getByLabel("Address", { exact: true }).fill("123 Test Street");
    await dialog.getByLabel("City", { exact: true }).fill("Los Angeles");
    await dialog.getByLabel("State / region").fill("CA");
    await dialog.getByLabel("Postal code").fill("90001");
    let quotes = 0;
    await page.route("**/api/shop/quote", route => {
      const body = route.request().postDataJSON();
      assert.equal(body.recipient.country_code, "US");
      assert.deepEqual(body.items, [{ syncVariantId: 7, quantity: 2 }]);
      quotes++;
      route.fulfill({ json: {
        quoteId: "fixture-quote", expiresAt: new Date(Date.now() + 900000).toISOString(), items: [{ ...item, price: 32 }], subtotal: 64,
        shippingRates: [{ id: "STANDARD", name: "Standard", rate: "5.25", currency: "USD" }, { id: "EXPRESS", name: "Express", rate: "9.50", currency: "USD" }],
      } });
    });
    await dialog.getByRole("button", { name: /continue to shipping/i }).click();
    await dialog.getByRole("radio", { name: /Standard/ }).waitFor();
    await dialog.getByRole("radio", { name: /Express/ }).check();
    assert.ok(await dialog.getByText("$73.50", { exact: true }).count());
    assert.equal(quotes, 1);
    const requested = [];
    await page.route("**/api/shop/checkout", route => {
      requested.push(route.request().postDataJSON());
      route.fulfill({ status: 503, json: { error: "Payment provider temporarily unavailable. Please retry." } });
    });
    await dialog.getByRole("button", { name: /continue to payment/i }).click();
    await dialog.getByRole("alert").filter({ hasText: "Payment provider temporarily unavailable" }).waitFor();
    assert.deepEqual(requested, [{ quoteId: "fixture-quote", shippingId: "EXPRESS" }]);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("def-studio-cart-v1"))[0].quantity), 2);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.evaluate(item => {
      sessionStorage.setItem("shop-checkout:cs_test_browser", JSON.stringify([item]));
      // One additional item added after going to checkout must survive a paid return.
      localStorage.setItem("def-studio-cart-v1", JSON.stringify([{ ...item, quantity: 3 }]));
    }, item);
    let paid = false;
    await page.route("**/api/shop/checkout/cs_test_browser/verify", route => route.fulfill({ json: { success: true, paid, status: paid ? "test_paid" : "awaiting_payment", testMode: true, message: paid ? "Test payment verified. No physical order was placed." : "Waiting for payment." } }));
    await page.goto(base + "/studio?success=true&session_id=cs_test_browser");
    await page.getByRole("heading", { name: "Awaiting payment", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("def-studio-cart-v1"))[0].quantity), 3);
    paid = true;
    await page.getByRole("button", { name: "Refresh status" }).click();
    await page.getByRole("heading", { name: "Test payment received", exact: true }).waitFor();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("def-studio-cart-v1"))[0]?.quantity === 1);
    await page.reload();
    await page.getByRole("heading", { name: "Test payment received", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("def-studio-cart-v1"))[0].quantity), 1);
    await page.getByRole("button", { name: "Close checkout" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`PASS shop address, quotes, payment failure, unpaid/paid return and replay safety at ${width}px (mocked provider responses)`);
    await context.close();
  }
} finally { await browser.close(); }
