import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

async function anchor(row) {
  await row.evaluate(element => window.scrollBy({
    top: element.getBoundingClientRect().top - 150, behavior: "instant",
  }));
  await row.page().waitForTimeout(700);
}
async function expanded(row, value) {
  await row.page().waitForFunction(({ id, value }) =>
    [...document.querySelectorAll("[data-project-id]")].find(node => node.dataset.projectId === id)?.dataset.expanded === String(value),
  { id: await row.getAttribute("data-project-id"), value });
}
async function open(row, keyboard) {
  const control = row.locator('button[aria-expanded="false"]').first();
  if (keyboard) { await control.focus(); await control.press(keyboard); }
  else await control.click();
  await expanded(row, true);
  await row.page().waitForTimeout(700);
}
async function noOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No horizontal overflow");
}
try {
  for (const [width, reducedMotion] of [[1440, "no-preference"], [390, "no-preference"], [390, "reduce"]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/projects");
    const rows = page.locator("[data-project-id]");
    await rows.first().waitFor();
    const originalOrder = await rows.evaluateAll(elements => elements.map(element => element.dataset.projectId));
    assert(originalOrder.length >= 3);
    const a = rows.nth(0), b = rows.nth(1), c = rows.nth(2);
    const id = originalOrder[0];
    const projectTitle = (await a.locator(".project-feed-title").innerText()).trim();
    // Native buttons expose the same state and a real, unique target region.
    const controls = a.locator("button[aria-controls][aria-expanded]");
    assert(await controls.count() >= 2, "Title and preview both expand the row");
    const ids = await controls.evaluateAll(elements => elements.map(element => element.getAttribute("aria-controls")));
    assert.equal(new Set(ids).size, 1);
    assert.equal(await page.locator(`[id="${ids[0]}"]`).count(), 1);
    await open(a, "Enter");
    const ribbon = a.locator(".project-feed-gallery");
    const ribbonBounds = await ribbon.boundingBox();
    assert(Math.abs(ribbonBounds.x) <= 2, "Expanded gallery starts at the viewport edge, not a center-column box");
    assert(Math.abs(ribbonBounds.width - width) <= 2, "Expanded gallery spans the full viewport");
    if (width < 768) {
      assert(ribbonBounds.height > 600, "Portrait mobile expands to a near-full-height horizontal gallery");
    }
    const visiblePanels = await a.locator(".swiper-slide").evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < innerWidth - 20 && rect.right > 20 && rect.width > 0;
    }).length);
    assert(visiblePanels >= 2, "The ribbon shows adjacent content rather than one isolated frame");
    const factsBounds = await a.locator(".project-ribbon-facts").boundingBox();
    const firstImageBounds = await a.locator(".project-ribbon-slide").first().boundingBox();
    const descriptionBounds = await a.locator(".project-ribbon-panel-slide--description").boundingBox();
    if (width >= 768) {
      assert(firstImageBounds.width >= width * .58, "Opened artwork is a large in-page image, not a small preview");
      assert(descriptionBounds.x + descriptionBounds.width <= width + 2, "Facts, first image, and description fit together on desktop");
    }
    assert(factsBounds.x + factsBounds.width <= firstImageBounds.x + 2, "Project facts are left of the first image");
    assert(descriptionBounds.x >= firstImageBounds.x + firstImageBounds.width - 2, "Description is right of the first image");
    if (width >= 768) {
      assert(Math.abs(factsBounds.y - firstImageBounds.y) < 15, "Facts and artwork share a horizontal row");
    } else {
      assert(Math.abs(factsBounds.y + factsBounds.height / 2 - firstImageBounds.y - firstImageBounds.height / 2) < 30,
        "Mobile facts and artwork are centered together vertically");
    }
    const closedLabel = await b.locator(".project-feed-label").boundingBox();
    const closedPreview = await b.locator(".project-feed-preview").boundingBox();
    if (width >= 768) {
      assert(Math.abs(closedPreview.x - closedLabel.x - closedLabel.width - 24) < 2,
        "Closed facts sit beside their own preview, not at the expanded gallery's viewport edge");
    } else {
      assert(closedLabel.y >= closedPreview.y + closedPreview.height,
        "Mobile facts remain below their own preview");
    }
    await anchor(a);
    const galleryRegion = a.getByRole("region", { name: `${projectTitle} gallery`, exact: true });
    assert.equal(await galleryRegion.getByRole("button", { name: /^(Previous|Next) image in/ }).count(), 0,
      "Expanded Projects gallery has no previous/next buttons");
    assert.equal(await a.locator(".project-zoom-controls").count(), 0, "Expanded Projects gallery has no zoom buttons");
    await ribbon.evaluate(element => element.scrollIntoView({ block: "center" }));
    await page.mouse.move(width - 12, 850);
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(120);
    assert.equal(await ribbon.getAttribute("data-focus"), "down", "User scrolling away immediately shrinks the gallery");
    if (width < 768) {
      await page.waitForTimeout(900);
      assert(Math.abs((await ribbon.boundingBox()).height - 390) < 3,
        "Portrait mobile scroll-away returns the ribbon to its original compact height");
    }
    await a.getByRole("button", { name: /^Open image 1 .* full screen$/ }).click({ force: true });
    assert.equal(await page.getByRole("dialog").count(), 0, "The first click restores the gallery without opening the image");
    await page.waitForTimeout(900);
    assert.equal(await ribbon.getAttribute("data-focus"), "up", "Click restores the gallery to full size");
    await page.screenshot({ path: `/tmp/project-ribbon-inline-${width}-${reducedMotion}.png` });
    assert.equal(await a.getByRole("button", { name: /^Enlarge/ }).count(), 0, "No separate Enlarge button");
    const artwork = a.getByRole("button", { name: /^Open image 1 .* full screen$/ });
    await artwork.click();
    const viewer = page.getByRole("dialog");
    await viewer.waitFor();
    const viewerBounds = await viewer.boundingBox();
    assert(Math.abs(viewerBounds.x) < 2 && Math.abs(viewerBounds.y) < 2, "Viewer starts at the screen edge");
    assert(Math.abs(viewerBounds.width - width) < 2 && Math.abs(viewerBounds.height - 900) < 2, "Viewer fills the screen");
    await page.screenshot({ path: `/tmp/project-fullscreen-${width}-${reducedMotion}.png` });
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });
    assert(await artwork.evaluate(element => element === document.activeElement), "Viewer restores image focus");
    await artwork.press("Enter");
    await viewer.waitFor();
    await viewer.getByRole("button", { name: "Close", exact: true }).click();
    await viewer.waitFor({ state: "hidden" });
    const artBounds = await artwork.boundingBox();
    const dragX = Math.min(width - 30, artBounds.x + artBounds.width / 2);
    await page.mouse.move(dragX, artBounds.y + 80);
    await page.mouse.down();
    await page.mouse.move(dragX - 110, artBounds.y + 80, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole("dialog").count(), 0, "Dragging pans without opening the image");
    const aCarousel = a.locator(".project-carousel-compact");
    await aCarousel.focus();
    await aCarousel.press("ArrowRight");
    await page.waitForTimeout(500);
    let aSlide = await a.getByRole("status").innerText();
    assert.match(aSlide, /Image 2 of/);
    if (width === 1440) {
      const track = a.locator(".swiper-wrapper");
      const beforePan = await track.getAttribute("style");
      await a.locator(".project-carousel").hover({ position: { x: width / 2, y: 80 } });
      await page.mouse.wheel(300, 0);
      await page.waitForTimeout(400);
      assert.notEqual(await track.getAttribute("style"), beforePan, "Horizontal wheel pans the full-width artwork");
      aSlide = await a.getByRole("status").innerText();
      const beforeScroll = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 180);
      await page.waitForTimeout(350);
      assert(await page.evaluate(() => scrollY) > beforeScroll + 80, "Vertical wheel remains page scrolling");
    }
    await open(b);
    await expanded(a, true);
    const bCarousel = b.locator(".project-carousel-compact");
    await bCarousel.focus();
    await bCarousel.press("ArrowRight");
    await page.waitForTimeout(500);
    const bSlide = await b.getByRole("status").innerText();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await anchor(a);
    assert.equal(await a.getByRole("status").innerText(), aSlide);
    assert.equal(await b.getByRole("status").innerText(), bSlide);
    await expanded(a, true);
    await expanded(b, true);
    await noOverflow(page);
    // Closing via keyboard must leave the row anchored, B open, and focus local.
    await aCarousel.focus();
    for (let i = 0; i < 20 && !(await a.getByRole("status").innerText()).includes("Image 1 of"); i++) {
      await aCarousel.press("ArrowLeft");
      await page.waitForTimeout(300);
    }
    const close = a.getByRole("button", { name: /^Close/ });
    await close.focus();
    const before = (await a.boundingBox()).y;
    await close.press("Enter");
    await expanded(a, false);
    await page.waitForTimeout(700);
    assert(Math.abs((await a.boundingBox()).y - before) < 12, "Close anchors its own row");
    await expanded(b, true);
    assert(await a.evaluate(element => element.contains(document.activeElement)), "Close restores focus in its row");
    await open(c, "Space");
    await expanded(b, true);
    await expanded(c, true);
    await open(a, "Space");
    assert.match(await a.getByRole("status").innerText(), /Image 1 of/, "Reopening restores the image selected before close");
    assert.deepEqual(await rows.evaluateAll(elements => elements.map(element => element.dataset.projectId)), originalOrder);
    assert.equal(new URL(page.url()).pathname, "/projects", "Expanding never navigates away");
    await noOverflow(page);
    await anchor(a);
    await page.screenshot({ path: `/tmp/project-feed-${width}-${reducedMotion}.png` });
    await page.goto(`${base}/project/${encodeURIComponent(id)}`);
    await page.getByRole("heading", { level: 1, name: projectTitle, exact: true }).waitFor();
    await noOverflow(page);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px ${reducedMotion}: independent A/B/C, stable order, scrolling, slides, local close/focus/anchor, keyboard, overflow, direct URL`);
    await context.close();
  }
} finally {
  await browser.close();
}
