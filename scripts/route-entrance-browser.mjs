import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});

async function sampleEntrance(page) {
  await page.locator(".route-entrance").waitFor({ state: "attached", timeout: 5000 });
  const samples = await page.evaluate(() => new Promise((resolve) => {
    const frames = [];
    const started = performance.now();
    function sample() {
      const overlay = document.querySelector(".route-entrance");
      const mark = overlay?.querySelector(".route-entrance-mark");
      const anchor = document.querySelector("[data-intro-brand]");
      if (!overlay || performance.now() - started > 2500) {
        resolve(frames);
        return;
      }
      if (mark && anchor) {
        const a = mark.getBoundingClientRect();
        const b = anchor.getBoundingClientRect();
        const wipe = overlay.querySelector(".route-entrance-wipe").getBoundingClientRect();
        frames.push({
          x: a.x + a.width / 2,
          y: a.y + a.height / 2,
          distance: Math.hypot(a.x + a.width / 2 - b.x - b.width / 2, a.y + a.height / 2 - b.y - b.height / 2),
          wipe: wipe.height / innerHeight,
          pointerEvents: getComputedStyle(overlay).pointerEvents,
        });
      }
      requestAnimationFrame(sample);
    }
    sample();
  }));
  await page.locator(".route-entrance").waitFor({ state: "detached", timeout: 2000 });
  assert(samples.length > 1, "Entrance produces animation frames");
  assert(samples.at(-1).distance < 20, "D.EF reaches the real header brand");
  assert(samples.at(-1).wipe > 0.98, "Black backdrop completes its white reveal");
  assert(samples.every((frame) => frame.pointerEvents === "none"), "Entrance never traps clicks");
}

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/projects");
    await sampleEntrance(page);
    assert.equal(await page.locator(".home-project-index").count(), 0, "The separate home screen is removed");
    assert(await page.locator("[data-project-id]").count() >= 3);
    // Use the actual navigation once, then exercise the shared route boundary.
    if (width >= 768) await page.locator(".projects-nav-toggle").click();
    else await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("link", { name: "About", exact: true }).filter({ visible: true }).click();
    await sampleEntrance(page);
    assert(await page.locator(".portfolio-shell--about").count() === 1, "About stays dark after the white entrance");
    for (const path of ["/publications", "/studio", "/", "/login", "/register"]) {
      await page.evaluate((next) => history.pushState({}, "", next), path);
      await sampleEntrance(page);
      assert(await page.locator("[data-intro-brand]").count() >= 1, `${path} has a real brand destination`);
    }
    await page.evaluate(() => history.pushState({}, "", "/register?source=motion#details"));
    await page.waitForTimeout(150);
    assert.equal(await page.locator(".route-entrance").count(), 0, "Query/hash changes do not replay the entrance");
    await page.evaluate(() => history.pushState({}, "", "/about"));
    await page.waitForTimeout(60);
    await page.evaluate(() => history.pushState({}, "", "/projects"));
    await page.waitForTimeout(1600);
    assert.equal(await page.locator(".route-entrance").count(), 0, "Rapid navigation cannot leave a stuck entrance");
    assert.equal(await page.locator(".home-index-intro-overlay").count(), 0, "No duplicate Home introduction");
    assert.deepEqual(errors, [], "No browser runtime errors");
    await context.close();
    console.log(`Route entrances passed at ${width}px`);
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await reduced.newPage();
  await page.goto(`${base}/projects`);
  assert.equal(await page.locator(".route-entrance").count(), 0, "Reduced motion skips the entrance");
  await page.evaluate(() => history.pushState({}, "", "/about"));
  await page.waitForTimeout(250);
  assert.equal(await page.locator(".route-entrance").count(), 0, "Reduced motion also skips route entrances");
  await reduced.close();
  console.log("Reduced-motion navigation passed");
} finally {
  await browser.close();
}
