import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

try {
  for (const width of [1920, 1440, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/projects");
    const first = page.getByRole("button", { name: "Expand Corp0rate-Circus", exact: true });
    await first.waitFor();
    const toggles = page.getByRole("button", { name: /^Expand / });
    assert.equal(await toggles.count(), 9);
    assert.equal(await page.getByRole("link", { name: /^View / }).count(), 0, "Do not restore redundant View links");
    assert(await page.getByRole("heading", { level: 1 }).count());
    const assertFits = async () => assert(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `No horizontal overflow at ${width}px`,
    );
    await assertFits();
    const boxes = await Promise.all((await toggles.all()).map(toggle => toggle.boundingBox()));
    assert(boxes.every(box => box && box.width > 40 && box.height > 40));
    if (width >= 1280) {
      const widths = new Set(boxes.map(box => Math.round(box.width / 40)));
      assert(widths.size >= 2, "Desktop images should vary in scale");
    }
    await first.focus();
    await page.keyboard.press("Enter");
    const collapse = page.getByRole("button", { name: "Collapse Corp0rate-Circus", exact: true });
    await collapse.waitFor();
    assert.equal(await collapse.getAttribute("aria-expanded"), "true");
    const panelId = await collapse.getAttribute("aria-controls");
    const panel = page.locator(`[id="${panelId}"]`);
    assert(await panel.isVisible());
    assert((await panel.boundingBox()).width > 250);
    await assertFits();
    await collapse.focus();
    await page.keyboard.press("Space");
    await first.waitFor();
    const competition = page.getByRole("button", { name: "Competition", exact: true });
    await competition.click();
    assert.equal(await competition.getAttribute("aria-pressed"), "true");
    await page.waitForFunction(() => [...document.querySelectorAll('button[aria-expanded]')].filter(
      button => button.getAttribute("aria-label")?.startsWith("Expand "),
    ).length === 4);
    await assertFits();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await first.waitFor();
    assert.equal(await toggles.count(), 9);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: spatial scale, all projects, keyboard expansion, filters and overflow`);
    await context.close();
  }
} finally {
  await browser.close();
}
