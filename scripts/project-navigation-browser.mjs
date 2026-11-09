import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

try {
  for (const width of [1920, 1233, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 928 } });
    const page = await context.newPage();
    await page.goto(base + "/projects");
    await page.locator(".project-feed").waitFor();
    assert.equal(await page.locator("main").evaluate(element => getComputedStyle(element).paddingLeft), "0px");
    const toggle = page.getByRole("button", { name: "Projects navigation", exact: true });
    const panel = page.locator("#projects-primary-navigation");
    if (width >= 768) {
      await toggle.hover();
      await page.waitForFunction(() => !document.querySelector("#projects-primary-navigation").hidden);
      assert(await panel.isVisible(), "Hover exposes the dropdown");
      await page.locator("h1").click();
      assert(!await panel.isVisible(), "Outside click dismisses navigation");
      await toggle.click();
      assert(await panel.isVisible(), "Click opens navigation even after hover");
      await panel.getByRole("link", { name: "About", exact: true }).focus();
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.querySelector("#projects-primary-navigation").hidden);
      assert(await toggle.evaluate(element => element === document.activeElement), "Escape restores focus");
      await page.locator("h1").click();
      await toggle.focus();
      await toggle.press("Enter");
      assert(await panel.isVisible(), "Keyboard activation opens navigation");
      await panel.getByRole("link", { name: "About", exact: true }).click();
    } else {
      assert(!await toggle.isVisible(), "No duplicate desktop menu on phones");
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      const mobile = page.locator("#mobile-navigation");
      assert(await mobile.isVisible(), "Mobile navigation opens by tap");
      await mobile.getByRole("link", { name: "About", exact: true }).click();
    }
    await page.waitForURL(/\/about$/);
    assert.equal(await page.locator("main").evaluate(element => getComputedStyle(element).paddingLeft), "0px", "Every route uses the compact navigation layout");
    await page.goto(base + "/projects");
    const row = page.locator("[data-project-id]").first();
    await row.getByRole("button", { name: /^Expand/ }).first().click();
    await page.waitForTimeout(500);
    if (width >= 768) {
      const art = await row.locator(".project-ribbon-slide").first().boundingBox();
      const description = await row.locator(".project-ribbon-panel-slide--description").boundingBox();
      assert(art.width >= width * .58 || art.height >= 928 * .65, "Artwork fills substantial available width or height");
      assert(description.x + description.width <= width + 2, "All three desktop columns fit");
    }
    await row.evaluate(element => window.scrollBy({ top: element.getBoundingClientRect().top - 95, behavior: "instant" }));
    await page.screenshot({ path: `/tmp/projects-wide-inline-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No page-level horizontal overflow");
    console.log(`PASS ${width}px: compact navigation, dismissal, working links, route isolation, large inline artwork`);
    await context.close();
  }
} finally {
  await browser.close();
}
