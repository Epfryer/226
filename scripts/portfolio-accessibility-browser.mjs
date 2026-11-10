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
    const rows = page.locator("[data-project-id]");
    await rows.first().waitFor();
    const titles = await rows.locator(".project-feed-label .project-feed-title button").allTextContents();
    assert.equal(titles.length, await rows.count());

    for (const [index] of titles.entries()) {
      const row = rows.nth(index);
      const expand = row.locator(".project-feed-label .project-feed-title button");
      const title = (await expand.innerText()).trim();
      await tabTo(page, expand);
      assert.equal(await expand.getAttribute("aria-expanded"), "false");
      await page.keyboard.press(index % 2 ? "Space" : "Enter");
      const collapse = page.getByRole("button", { name: `Collapse ${title}`, exact: true });
      assert.equal(await collapse.getAttribute("aria-expanded"), "true");
      const close = row.getByRole("button", { name: /^Close/ });
      assert(await close.evaluate(el => el === document.activeElement), "Expansion moves focus to the close control");
      const panelId = await collapse.getAttribute("aria-controls");
      assert(await page.locator(`[id="${panelId}"]`).isVisible());
      const gallery = page.getByRole("region", { name: `${title} gallery`, exact: true });
      const status = gallery.getByRole("status");
      const images = gallery.locator(".project-ribbon-image");
      const count = await images.count();
      assert(count >= 3);
      for (const image of await images.all()) {
        assert((await image.getAttribute("alt")).length > 20);
      }
      assert.equal(await status.innerText(), `Image 1 of ${count}`);
      assert.equal(await gallery.getByRole("button", { name: /^(Previous|Next) image in/ }).count(), 0,
        "Compact project galleries do not show previous/next buttons");
      await gallery.focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(400);
      assert.equal(await status.innerText(), `Image 2 of ${count}`);
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(400);
      assert.equal(await status.innerText(), `Image 1 of ${count}`);
      // All content must be reachable without dragging, including the final image.
      for (let i = 1; i < count; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(350);
      }
      assert.equal(await status.innerText(), `Image ${count} of ${count}`);
      await collapse.focus();
      await page.keyboard.press("Space");
      assert.equal(await expand.getAttribute("aria-expanded"), "false");
      assert(await row.locator(".project-feed-preview").evaluate(el => el === document.activeElement),
        "Collapse restores focus to the project's preview");
      assert.equal(await page.getByRole("region", { name: `${title} gallery`, exact: true }).count(), 0);
    }
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(`PASS ${width}px: both footer variants, filters, all project toggles, image descriptions, gallery controls and boundaries`);
    await context.close();
  }
} finally {
  await browser.close();
}
