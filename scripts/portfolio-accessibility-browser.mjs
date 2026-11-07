import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});

async function tabTo(page, locator) {
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate(el => el === document.activeElement)) return;
  }
  assert.fail("Control could not be reached using Tab");
}

try {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const path of ["/projects", "/about"]) {
      await page.goto(base + path);
      const links = page.locator("footer a");
      await links.first().waitFor();
      assert.equal(await links.count(), 2);
      for (const link of await links.all()) {
        assert.match(await link.getAttribute("href"), /^https:\/\//);
        assert.equal(await link.getAttribute("target"), "_blank");
        assert.match(await link.getAttribute("rel"), /noopener/);
        assert.equal(await link.getAttribute("tabindex"), null);
        await tabTo(page, link);
        const popupPromise = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await popupPromise;
        await popup.close();
      }
    }

    await page.goto(base + "/projects");
    const all = page.getByRole("button", { name: "All", exact: true });
    const academic = page.getByRole("button", { name: "Academic", exact: true });
    await all.waitFor();
    assert.equal(await all.getAttribute("aria-pressed"), "true");
    await tabTo(page, academic);
    await page.keyboard.press("Space");
    assert.equal(await academic.getAttribute("aria-pressed"), "true");
    assert.equal(await all.getAttribute("aria-pressed"), "false");
    await page.keyboard.press("Enter");
    assert.equal(await academic.getAttribute("aria-pressed"), "false");
    assert.equal(await all.getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Expand Corp0rate-Circus", exact: true }).waitFor();
    const titles = await page.getByRole("button", { name: /^Expand / }).evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-label")));
    assert.equal(titles.length, 9);

    for (const [index, text] of titles.entries()) {
      const title = text.replace(/^Expand /, "");
      const expand = page.getByRole("button", { name: `Expand ${title}`, exact: true });
      await tabTo(page, expand);
      assert.equal(await expand.getAttribute("aria-expanded"), "false");
      await page.keyboard.press(index % 2 ? "Space" : "Enter");
      const collapse = page.getByRole("button", { name: `Collapse ${title}`, exact: true });
      assert.equal(await collapse.getAttribute("aria-expanded"), "true");
      assert(await collapse.evaluate(el => el === document.activeElement), "Expansion must retain focus");
      const panelId = await collapse.getAttribute("aria-controls");
      assert(await page.locator(`[id="${panelId}"]`).isVisible());
      const gallery = page.getByRole("region", { name: `${title} gallery`, exact: true });
      const previous = gallery.getByRole("button", { name: `Previous image in ${title}`, exact: true });
      const next = gallery.getByRole("button", { name: `Next image in ${title}`, exact: true });
      const status = gallery.getByRole("status");
      const images = gallery.locator("img");
      const count = await images.count();
      assert(count >= 3);
      for (const image of await images.all()) {
        assert((await image.getAttribute("alt")).length > 20);
      }
      assert.equal(await status.innerText(), `Image 1 of ${count}`);
      assert(await previous.isDisabled());
      await tabTo(page, next);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);
      assert.equal(await status.innerText(), `Image 2 of ${count}`);
      await tabTo(page, previous);
      await page.keyboard.press("Space");
      await page.waitForTimeout(400);
      assert.equal(await status.innerText(), `Image 1 of ${count}`);
      // All content must be reachable without dragging, including the final image.
      await next.focus();
      for (let i = 0; i < count && await next.isEnabled(); i++) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(350);
      }
      assert(await next.isDisabled(), "Next must stop at the gallery boundary");
      assert.equal(await status.innerText(), `Image ${count} of ${count}`);
      await collapse.focus();
      await page.keyboard.press("Space");
      assert.equal(await expand.getAttribute("aria-expanded"), "false");
      assert(await expand.evaluate(el => el === document.activeElement), "Collapse must retain focus");
      assert.equal(await page.getByRole("region", { name: `${title} gallery`, exact: true }).count(), 0);
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(`PASS ${width}px: both footer variants, filters, all project toggles, image descriptions, gallery controls and boundaries`);
    await context.close();
  }
} finally {
  await browser.close();
}
