import assert from "node:assert/strict";
import { waitForReader } from "./reader-checks.mjs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const sleep = (page, ms = 400) => page.waitForTimeout(ms);
async function settle(page) { await sleep(page, 1100); }
async function paintedReader(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector(".pdf-viewer-container");
    const pageNumber = root?.getAttribute("data-reader-page");
    const current = root?.querySelector(`[data-pdf-page="${pageNumber}"] canvas`);
    const next = root?.querySelector(`[data-pdf-page="${Number(pageNumber) + 1}"] canvas`);
    return !!current?.__rendered && (!next || !!next.__rendered);
  }, null, { timeout: 45000 });
}
async function wheelResult(image, options) {
  return image.evaluate((element, options) => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100, ...options });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, options);
}
async function open(row) {
  await row.locator('button[aria-expanded="false"]').first().click();
  await sleep(row.page());
}

async function clickPdfLinkWithoutNavigation(link) {
  await link.evaluate(element => {
    // Exercise the real click handler without opening/downloading a large PDF.
    element.addEventListener("click", event => event.preventDefault(), { once: true });
    element.click();
  });
}

try {
  for (const [width, reducedMotion] of [[1440, "no-preference"], [390, "reduce"]]) {
    const context = await browser.newContext({ viewport: { width, height: 928 }, reducedMotion, hasTouch: width < 768, isMobile: width < 768 });
    await context.addInitScript(() => {
      // Tests never send visitor events to the live analytics service.
      window.__analyticsEvents = [];
      window.umami = { track: (name, data) => window.__analyticsEvents.push({ name, data }) };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") console.error(message.text()); });
    await page.goto(base + "/projects");
    const rows = page.locator("[data-project-id]");
    await rows.first().waitFor();
    const order = await rows.evaluateAll(elements => elements.map(element => element.dataset.projectId));
    const a = rows.nth(0), b = rows.nth(1);
    await open(a);
    await open(b);
    await a.getByRole("button", { name: /Next image in/ }).click();
    await sleep(page);
    const selected = await a.getByRole("status").innerText();
    const image = a.locator(".project-image-open").nth(1);
    await image.press("Enter");
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    for (let i = 0; i < 4; i++) {
      assert(await wheelResult(image, { altKey: true, deltaY: 100 }), "Alt-wheel zoom is handled");
      await sleep(page, 30);
    }
    await sleep(page, 650);
    assert.equal(await page.evaluate(() => window.__analyticsEvents.filter(event => event.name === "project_zoom_changed").length), 1, "A multi-frame zoom gesture emits one settled event");
    assert.equal(await a.getAttribute("data-project-zoom"), "0.760");
    assert.equal(await b.getAttribute("data-project-zoom"), "1.000");
    assert.equal(await a.getByRole("status").innerText(), selected, "Zoom preserves the selected gallery image");
    assert(!await wheelResult(image, {}), "Ordinary wheel is not consumed");
    assert(!await wheelResult(image, { ctrlKey: true, altKey: true }), "Browser Ctrl-wheel remains available");
    assert(!await wheelResult(image, { metaKey: true, altKey: true }), "Browser Cmd-wheel remains available");
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await sleep(page);
    await page.getByRole("button", { name: "Competition", exact: true }).click();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await sleep(page);
    assert.equal(await a.getAttribute("data-expanded"), "true");
    assert.equal(await a.getAttribute("data-project-zoom"), "0.760");
    assert.equal(await b.getAttribute("data-expanded"), "true");
    assert.equal(await a.getByRole("status").innerText(), selected);
    await a.getByRole("button", { name: /^Zoom out/ }).press("Enter");
    await sleep(page);
    assert.equal(await a.getAttribute("data-project-zoom"), "0.750");
    assert(!await wheelResult(a.locator(".project-image-open").first(), { altKey: true, deltaY: 100 }), "Zoom at its lower boundary does not consume scrolling");
    await a.getByRole("button", { name: /^Zoom in/ }).press("Enter");
    await sleep(page);
    assert.equal(await a.getAttribute("data-project-zoom"), "0.800");
    assert(await wheelResult(a.locator(".project-image-open").first(), { altKey: true, deltaY: -1000 }), "Alt-wheel up restores expanded artwork");
    await sleep(page);
    assert.equal(await a.getAttribute("data-project-zoom"), "1.000");
    // Return to the leading panel to reach the row's Close control.
    await a.locator(".swiper").evaluate(element => element.swiper.slideTo(0, 0));
    await a.getByRole("button", { name: /^Close/ }).press("Enter");
    await sleep(page);
    assert.equal(await a.getAttribute("data-expanded"), "false");
    assert.equal(await b.getAttribute("data-expanded"), "true");
    assert.deepEqual(await rows.evaluateAll(elements => elements.map(element => element.dataset.projectId)), order);

    await page.getByRole("button", { name: "Publications", exact: true }).click();
    const publication = page.locator('[data-publication-id="EthanFryer-5thYear-SelectedWorks"]');
    await publication.getByRole("button", { name: "Open 5th Year Selected Works", exact: true }).first().click();
    await waitForReader(page);
    await paintedReader(page);
    await clickPdfLinkWithoutNavigation(publication.getByRole("link", { name: "Open PDF", exact: true }));
    const reader = page.locator(".pdf-viewer-container");
    await reader.focus();
    for (let i = 0; i < 3; i++) { await page.keyboard.press("ArrowRight"); await settle(page); }
    const spread = Number(await reader.getAttribute("data-reader-page"));
    assert(spread >= 4, "The real publication turns several pages");
    const pageEventCount = await page.evaluate(() => window.__analyticsEvents.filter(event => event.name === "publication_page_changed").length);
    assert(pageEventCount >= 3, "Reader page turns emit custom events");
    await page.keyboard.press("+");
    await page.keyboard.press("+");
    await page.keyboard.press("Shift+ArrowLeft");
    await sleep(page);
    assert(Number(await reader.getAttribute("data-reader-zoom")) > 1.3, "Existing reader keyboard zoom works");
    const surface = reader.locator(".fv-root");
    const handled = await surface.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -100, clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    assert(handled, "The flipper retains its own Ctrl-wheel zoom");
    await sleep(page);
    if (width < 768) {
      await reader.scrollIntoViewIfNeeded();
      const bounds = await surface.boundingBox();
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
      const cdp = await context.newCDPSession(page);
      const touches = distance => [{ x: x - distance, y, id: 1 }, { x: x + distance, y, id: 2 }];
      const beforePinch = Number(await surface.getAttribute("data-zoom"));
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(24) });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(36) });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(44) });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(page);
      assert(Number(await surface.getAttribute("data-zoom")) > beforePinch, "Touch pinch still zooms the book");
      await cdp.detach();
    }
    await reader.focus();
    await page.keyboard.press("Shift+ArrowLeft");
    await sleep(page);
    const zoom = Number(await reader.getAttribute("data-reader-zoom"));
    const pan = Number(await surface.getAttribute("data-pan-x"));
    assert(pan > 0, "The zoomed book can pan");
    assert.equal(await page.evaluate(() => window.__analyticsEvents.filter(event => event.name === "publication_page_changed").length), pageEventCount, "Zoom and pan snapshots do not produce false page-turn events");
    await reader.evaluate(element => { window.__readingElement = element; });
    await publication.getByRole("button", { name: "Pin reader", exact: true }).click();
    await settle(page);
    const pinned = page.locator(".publication-pinned-reader.is-visible");
    await pinned.waitFor();
    assert(await reader.evaluate(element => element === window.__readingElement), "Pinning retains the same viewer instance");
    assert.equal(Number(await reader.getAttribute("data-reader-page")), spread);
    assert(Math.abs(Number(await reader.getAttribute("data-reader-zoom")) - zoom) < .03, "Pinning preserves zoom");
    assert(Math.abs(Number(await surface.getAttribute("data-pan-x")) - pan) < .04, "Pinning preserves normalized pan");
    await page.getByRole("button", { name: "Academic", exact: true }).click();
    await open(rows.first());
    assert(await pinned.isVisible(), "Pinned book survives filtering and project opening");
    if (width >= 768) {
      await clickPdfLinkWithoutNavigation(pinned.getByRole("link", { name: "PDF", exact: true }));
      await pinned.getByRole("button", { name: "Dock left", exact: true }).click();
      assert((await pinned.boundingBox()).x <= 15);
      await pinned.getByRole("button", { name: "Dock right", exact: true }).click();
      const title = pinned.locator(".publication-reader-title");
      const rect = await title.boundingBox();
      await page.mouse.move(rect.x + 30, rect.y + 15);
      await page.mouse.down();
      await page.mouse.move(-200, -200, { steps: 10 });
      await page.mouse.up();
      const bounds = await pinned.boundingBox();
      assert(bounds.x >= 7 && bounds.y >= 7 && bounds.x + bounds.width <= width + 1, "Dragged reader stays in the viewport");
    } else {
      await pinned.getByRole("button", { name: "Minimize", exact: true }).click();
      assert((await pinned.boundingBox()).height <= 60);
      await pinned.getByRole("button", { name: "Restore", exact: true }).click();
      await settle(page);
      assert.equal(Number(await reader.getAttribute("data-reader-page")), spread);
      assert(Math.abs(Number(await reader.getAttribute("data-reader-zoom")) - zoom) < .03);
    }
    await reader.focus();
    await page.keyboard.press("ArrowRight");
    await settle(page);
    const nextSpread = Number(await reader.getAttribute("data-reader-page"));
    assert(nextSpread > spread, "Pinned reader remains usable");
    await pinned.getByRole("button", { name: "Return inline", exact: true }).click();
    await settle(page);
    assert(await publication.isVisible(), "Returning reveals a filtered-out publication");
    assert(await reader.evaluate(element => element === window.__readingElement), "Returning inline does not remount the book");
    assert.equal(Number(await reader.getAttribute("data-reader-page")), nextSpread);
    await publication.getByRole("button", { name: /^Close/ }).click();
    await publication.getByRole("button", { name: "Open 5th Year Selected Works", exact: true }).first().click();
    await waitForReader(page);
    await paintedReader(page);
    assert.equal(Number(await reader.getAttribute("data-reader-page")), nextSpread, "Close/reopen retains the spread");
    const pdf = publication.getByRole("link", { name: "Open PDF", exact: true });
    const response = await page.request.get(new URL(await pdf.getAttribute("href"), base).href, { headers: { Range: "bytes=0-1023" } });
    assert([200, 206].includes(response.status()), "PDF link serves the original document");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No page-level horizontal overflow");
    await page.screenshot({ path: `/tmp/projects-reader-${width}-${reducedMotion}.png` });
    const projectEvents = await page.evaluate(() => window.__analyticsEvents);
    await page.goto(base + "/publications?doc=EthanFryer-5thYear-SelectedWorks");
    await page.getByRole("dialog").waitFor();
    await waitForReader(page);
    await paintedReader(page);
    await clickPdfLinkWithoutNavigation(page.getByRole("link", { name: /Download .* as PDF/ }));
    const legacyPage = Number(await page.locator(".pdf-viewer-container").getAttribute("data-reader-page"));
    await page.keyboard.press("ArrowRight");
    await settle(page);
    assert(Number(await page.locator(".pdf-viewer-container").getAttribute("data-reader-page")) > legacyPage, "Existing publication deep links and keyboard page turns still work");
    await page.getByRole("button", { name: "Close publication", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await clickPdfLinkWithoutNavigation(page.getByRole("link", { name: "Read 5th Year Selected Works as a PDF", exact: true }));
    const events = [...projectEvents, ...await page.evaluate(() => window.__analyticsEvents)];
    for (const name of ["project_expanded", "project_closed", "project_category_selected", "project_gallery_changed", "project_image_opened", "project_zoom_changed", "publication_opened", "publication_page_changed", "publication_download_clicked", "publication_reader_action"]) {
      assert(events.some(event => event.name === name), `${name} fires from the working UI`);
    }
    const actions = events.filter(event => event.name === "publication_reader_action").map(event => event.data.action);
    for (const action of ["pin", "return_inline", "close", ...(width >= 768 ? ["dock"] : ["minimize", "restore"])]) {
      assert(actions.includes(action), `Reader ${action} is instrumented`);
    }
    const downloads = events.filter(event => event.name === "publication_download_clicked").map(event => event.data.location);
    for (const location of ["projects_inline", "publication_modal", "publications_list", ...(width >= 768 ? ["pinned"] : [])]) {
      assert(downloads.includes(location), `PDF link ${location} is instrumented`);
    }
    for (const event of events) {
      assert(/^[a-z][a-z0-9_]{0,48}$/.test(event.name), "Event names are short snake_case");
      assert(Object.values(event.data || {}).every(value => ["string", "number", "boolean"].includes(typeof value)), "Only flat analytics dimensions are sent");
      assert(!Object.keys(event.data || {}).some(key => /email|address|phone|password|token|session|name$/.test(key)), "No personal or checkout identifiers are sent");
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px ${reducedMotion}: project/reader behavior and custom analytics, settled zoom, page-turn filtering, reader actions and PDF sources`);
    await context.close();
  }
} finally { await browser.close(); }
