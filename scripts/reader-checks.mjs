import assert from "node:assert/strict";

export async function waitForReader(page) {
  await page.waitForFunction(() => {
    const surface = document.querySelector(".fv-root");
    return surface?.dataset.zoom && [...surface.querySelectorAll("canvas")].some(canvas => canvas.width > 0);
  }, null, { timeout: 45000 });
}

export async function verifyGlassReader(page, browserName, width) {
  await waitForReader(page);
  const zoom = () => page.locator(".fv-root").getAttribute("data-zoom").then(Number);
  const bounds = await page.locator(".reader-shell__viewer").boundingBox();
  const viewport = page.viewportSize();
  assert.equal(Math.round(bounds.x), 0);
  assert.equal(Math.round(bounds.y), 0);
  assert.equal(Math.round(bounds.width), viewport.width);
  assert.equal(Math.round(bounds.height), viewport.height);
  assert.equal(await page.locator(".fv-toolbar").count(), 0, "Command bar is removed from DOM");
  assert(await page.getByRole("link", { name: /Download .* as PDF/ }).isVisible());
  await page.getByRole("button", { name: "Close publication" }).focus();
  await page.keyboard.press("Tab");
  assert(await page.getByRole("link", { name: /Download .* as PDF/ }).evaluate(el => el === document.activeElement));
  await page.keyboard.press("Tab");
  assert(await page.getByRole("button", { name: "Reset zoom" }).evaluate(el => el === document.activeElement));
  await page.keyboard.press("Tab");
  assert(await page.getByRole("button", { name: "Close publication" }).evaluate(el => el === document.activeElement));

  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")) > 1);
  await page.waitForTimeout(950);
  const stored = await page.evaluate(() => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")));
  const fitted = await page.locator(".fv-pageLayer").boundingBox();
  if (browserName === "chromium" && width === 1440) {
    await page.mouse.move(fitted.x + fitted.width - 12, fitted.y + 12);
    await page.mouse.down();
    await page.mouse.move(fitted.x + 20, fitted.y + 24, { steps: 16 });
    await page.mouse.up();
    await page.waitForFunction(previous => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")) > previous, stored);
    await page.waitForTimeout(950);
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(previous => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")) === previous, stored);
    await page.waitForTimeout(950);
  }
  for (let i = 0; i < 5; i++) await page.keyboard.press("+");
  assert(await zoom() > 2, "Keyboard zoom enlarges the spread");
  const expanded = await page.locator(".fv-pageLayer").boundingBox();
  assert(expanded.width > fitted.width * 2);
  // Hit-test outside the original fitted book: the zoomed page must actually
  // paint there, not just report an enlarged bounding rectangle under a clip.
  const probeX = Math.max(4, fitted.x - 8);
  assert(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest(".pdf-page")), {
    x: probeX, y: viewport.height / 2,
  }), "Zoomed pages render beyond the original fitted-book boundary");
  const before = await page.locator(".fv-pageLayer").getAttribute("style");
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.down();
  await page.mouse.move(viewport.width / 2 - 100, viewport.height / 2 + 90, { steps: 8 });
  await page.mouse.up();
  assert.notEqual(await page.locator(".fv-pageLayer").getAttribute("style"), before, "Drag pans enlarged pages");
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf"))), stored, "Pan must not turn a page");
  await page.keyboard.press("0");
  assert.equal(await zoom(), 1);
  await page.mouse.dblclick(viewport.width / 2, viewport.height / 2);
  assert.equal(await zoom(), 2, "Double-click zooms");
  // Let the platform's multi-click sequence expire before the next double
  // click; back-to-back calls can become a triple/quadruple click in WebKit.
  await page.waitForTimeout(650);
  await page.mouse.dblclick(viewport.width / 2, viewport.height / 2);
  assert.equal(await zoom(), 1, "Double-click resets");
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -250);
  await page.keyboard.up("Control");
  await page.waitForFunction(() => Number(document.querySelector(".fv-root").dataset.zoom) > 1);
  await page.keyboard.press("0");

  if (browserName === "chromium" && width === 390) {
    const cdp = await page.context().newCDPSession(page);
    const touch = async points => cdp.send("Input.dispatchTouchEvent", {
      type: points.length ? "touchMove" : "touchEnd",
      touchPoints: points.map(([x, y], id) => ({ x, y, id })),
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 130, y: 450, id: 0 }, { x: 260, y: 450, id: 1 }] });
    await touch([[110, 450], [280, 450]]);
    await touch([[80, 450], [310, 450]]);
    await touch([]);
    assert(await zoom() > 1.2, "Emulated two-touch pinch zooms the document");
    assert.equal(await page.evaluate(() => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf"))), stored, "Pinch must not turn a page");
    await cdp.detach();
    await page.keyboard.press("0");
    const swipe = await page.context().newCDPSession(page);
    await swipe.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 320, y: 450, id: 0 }] });
    for (const x of [290, 250, 210, 160]) {
      await swipe.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: 450, id: 0 }] });
    }
    await swipe.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForFunction(previous => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")) > previous, stored);
    await page.waitForTimeout(950);
    await page.keyboard.press("ArrowLeft");
    await page.waitForFunction(previous => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")) === previous, stored);
    await page.waitForTimeout(950);
    await swipe.detach();
  }

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(900);
  await waitForReader(page);
  assert.equal(await zoom(), 1, "Orientation/resize recomputes the untransformed fit");
  const landscape = await page.locator(".fv-pageLayer").boundingBox();
  assert(landscape.width <= 844 && landscape.height <= 390);
  assert(await page.getByRole("button", { name: "Close publication" }).isVisible());
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: /Open Test publication/ }).click();
  await waitForReader(page);
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf"))), stored);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert(await page.getByRole("button", { name: /Open Test publication/ }).evaluate(el => el === document.activeElement), "Close returns focus to the publication");
}
