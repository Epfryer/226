import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="#ddd"/></svg>');
const products = [101, 202].map((id, index) => ({
  id, external_id: String(id), name: `Discovery Tee ${index + 1}`,
  variants: 4, synced: 4, thumbnail_url: image, is_ignored: false,
}));

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/shop/products", route => route.fulfill({ json: { code: 200, result: products } }));
    await page.route(/\/api\/shop\/products\/\d+$/, route => {
      const id = Number(route.request().url().split("/").pop());
      const product = products.find(item => item.id === id);
      return route.fulfill({ json: { code: 200, result: {
        sync_product: product,
        sync_variants: ["Black", "White"].flatMap(color => ["M", "L"].map(size => ({ color, size }))).map(({ color, size }, index) => ({
          id: id * 10 + index, variant_id: id * 10 + index, sync_product_id: id,
          external_id: `${id}-${index}`, name: product.name, synced: true,
          color, size, retail_price: "25.00", currency: "USD",
          availability_status: "active", files: [],
          product: { image, name: product.name, variant_id: id * 10 + index, product_id: id },
        })),
      } } });
    });
    await page.goto(`${base}/studio`);
    const card = page.getByRole("link", { name: "View Discovery Tee 2", exact: true });
    await card.waitFor();
    assert.equal(await card.getAttribute("href"), "/studio/202");
    await card.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    assert.equal(await card.evaluate(element => element === document.activeElement), true);
    assert.equal(await card.evaluate(element => getComputedStyle(element).outlineStyle), "solid");
    assert.equal(await card.evaluate(element => getComputedStyle(element).outlineWidth), "3px");
    const categoryRoot = width < 1024 ? page.locator(".lg\\:hidden").filter({ has: page.getByRole("button", { name: "ALL", exact: true }) }) : page.locator("nav");
    await categoryRoot.getByRole("button", { name: "GARMENTS", exact: true }).click();
    assert.equal(await categoryRoot.getByRole("button", { name: "GARMENTS", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await categoryRoot.getByRole("button", { name: "ALL", exact: true }).getAttribute("aria-pressed"), "false");
    await card.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/studio/202");
    const scope = width < 1024 ? page.getByRole("dialog") : page.locator(".hidden.lg\\:block").last();
    await scope.getByRole("button", { name: "Select White color", exact: true }).click();
    assert.equal(await scope.getByRole("button", { name: "Select White color", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await scope.getByRole("button", { name: "Select Black color", exact: true }).getAttribute("aria-pressed"), "false");
    await scope.getByRole("button", { name: "Select size M", exact: true }).click();
    assert.equal(await scope.getByRole("button", { name: "Select size M", exact: true }).getAttribute("aria-pressed"), "true");
    await scope.getByRole("button", { name: "Select size L", exact: true }).click();
    assert.equal(await scope.getByRole("button", { name: "Select size L", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await scope.getByRole("button", { name: "Select size M", exact: true }).getAttribute("aria-pressed"), "false");
    await page.reload();
    await page.getByRole("button", { name: "Select White color", exact: true }).filter({ visible: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/studio/202");
    if (width < 1024) assert.equal(await page.getByRole("dialog").count(), 1);
    await page.goBack();
    await page.waitForURL("**/studio");
    if (width < 1024) await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.goForward();
    await page.waitForURL("**/studio/202");
    await page.goto(`${base}/studio/not-a-product`);
    await page.getByRole("status").filter({ hasText: "Product not found" }).waitFor();
    await page.getByRole("link", { name: "Browse all Studio products" }).click();
    await page.waitForURL("**/studio");
    assert.deepEqual(errors, []);
    console.log(`PASS Studio links, direct/reload/history routes, selection states, focus and missing products at ${width}px`);
    await context.close();
  }
} finally {
  await browser.close();
}
