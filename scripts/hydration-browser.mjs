import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && /hydrat|server HTML/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    for (const route of ["/", "/about", "/projects", "/publications", "/project/Corp0rate-Circus", "/studio"]) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200, route);
      const html = await response.text();
      assert(html.includes('class="public-document"'), `Semantic server content on ${route}`);
      assert(!html.includes('href="/contact"'), `No stale contact link on ${route}`);
      await page.locator("header.portfolio-header").waitFor();
      assert.equal(await page.locator(".public-document").count(), 0, `Interactive enhancement on ${route}`);
      assert.deepEqual(errors, [], `No hydration or runtime errors on ${route}`);
      console.log(`PASS ${width}px ${route}: server document hydrates and interactive app loads`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
