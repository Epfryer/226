import assert from "node:assert/strict";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

async function checkFeed(page, width) {
  const rows = await page.locator(".project-feed-row").evaluateAll(elements => elements.map(row => {
    const label = row.querySelector(".project-feed-label").getBoundingClientRect();
    const preview = row.querySelector(".project-feed-preview").getBoundingClientRect();
    return {
      kind: row.hasAttribute("data-project-id") ? "project" : "publication",
      year: Number(row.querySelector(".project-feed-year").textContent),
      gap: preview.left - label.right,
      centerDelta: Math.abs((preview.top + preview.height / 2) - (label.top + label.height / 2)),
      previewBottom: preview.bottom,
      labelTop: label.top,
    };
  }));
  const years = rows.map(row => row.year);
  assert.deepEqual(years, [...years].sort((a, b) => b - a), "Every visible row follows the shared chronology");
  for (const row of rows) {
    if (width >= 768) {
      assert(Math.abs(row.gap - 24) < 1, `${row.kind} ${row.year}: facts immediately left of its own preview`);
      assert(row.centerDelta < 1, "Facts vertically centered beside the preview");
    } else {
      assert(row.labelTop >= row.previewBottom, "Existing mobile stacking is unchanged");
    }
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No horizontal overflow");
  return rows;
}

try {
  for (const width of [2401, 1440, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base + "/projects");
    await page.locator("[data-publication-id]").first().waitFor();
    const all = await checkFeed(page, width);
    assert(all.some(row => row.kind === "publication") && all.some(row => row.kind === "project"));
    assert.equal(all[0].kind, "publication", "A newer publication is not relegated after all projects");
    for (const category of ["Academic", "Competition", "Publications"]) {
      await page.getByRole("button", { name: category, exact: true }).click();
      const rows = await checkFeed(page, width);
      assert(rows.length > 0);
      assert(rows.every(row => row.kind === (category === "Publications" ? "publication" : "project")));
    }
    await page.getByRole("button", { name: "All", exact: true }).click();
    assert.deepEqual(await checkFeed(page, width), all, "Returning to All restores order and layout");
    assert.deepEqual(errors, []);
    if (width === 2401) await page.screenshot({ path: "/tmp/project-feed-alignment-desktop.png" });
    console.log(`PASS ${width}px: every label aligned, mixed date order, category filters, no overflow or page errors`);
    await context.close();
  }
} finally {
  await browser.close();
}
