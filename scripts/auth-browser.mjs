import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import pg from "pg";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
if (process.env.NODE_ENV === "production" || !/(\.replit\.dev$|^localhost$|^127\.0\.0\.1$)/.test(new URL(base).hostname)) {
  throw new Error("Run account browser tests only against a development app/database.");
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const executablePath = process.env.CHROMIUM_PATH || (existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const created = [];
mkdirSync("generated-artifacts/auth", { recursive: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const route of ["/login", "/register", "/account"]) {
      const response = await page.goto(base + route);
      assert.equal(response.status(), 200);
      assert.match(response.headers()["cache-control"], /no-store/);
      await page.locator("h1").waitFor();
      assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex, follow");
    }
    const name = `browser_${randomUUID().slice(0, 12)}`;
    created.push(name);
    const password = `Fixture password ${randomUUID()}`;
    await page.goto(base + "/register");
    await page.getByLabel("Username", { exact: true }).fill(name);
    // Keyboard tab order and native submission work without pointer interaction.
    await page.keyboard.press("Tab");
    assert.equal(await page.locator("#account-password").evaluate(el => el === document.activeElement), true);
    await page.keyboard.type(password);
    await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("button", { name: "Register", exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Enter");
    await page.waitForURL(base + "/account");
    await page.getByRole("heading", { name, exact: true }).waitFor();
    assert.equal(await page.locator("dd").innerText(), "Visitor");
    const cookieBefore = (await context.cookies()).find(cookie => cookie.name === "def_session").value;
    await page.reload();
    await page.getByRole("heading", { name, exact: true }).waitFor();
    await page.screenshot({ path: `generated-artifacts/auth/account-${width}.jpg`, fullPage: true });
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(base + "/login");
    await page.goto(base + "/account");
    await page.getByRole("heading", { name: "You are signed out." }).waitFor();
    assert.equal(await page.getByRole("heading", { name, exact: true }).count(), 0);
    const replay = await context.request.get(base + "/api/auth/me", { headers: { Cookie: `def_session=${encodeURIComponent(cookieBefore)}` } });
    assert.equal((await replay.json()).user, null);

    await page.goto(base + "/login?returnTo=%2Faccount");
    await page.getByLabel("Username", { exact: true }).fill(name.toUpperCase());
    await page.getByLabel("Password", { exact: true }).fill("Wrong password value");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Invalid username or password." }).waitFor();
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(base + "/account");
    await page.getByRole("heading", { name, exact: true }).waitFor();
    // A failed refetch must hide cached private account details.
    await page.route("**/api/auth/me", route => route.fulfill({ status: 503, json: { error: "Temporary outage" } }));
    await page.goto(base + "/account");
    await page.getByRole("heading", { name: "Account unavailable." }).waitFor();
    assert.equal(await page.getByRole("heading", { name, exact: true }).count(), 0);
    await page.unroute("**/api/auth/me");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.getByRole("heading", { name, exact: true }).waitFor();
    // Confirm shared account navigation exists in Studio without replacing cart.
    await page.goto(base + "/studio");
    await page.getByRole("button", { name: "Open cart", exact: true }).waitFor();
    let panel;
    if (width >= 768) {
      const trigger = page.locator(".projects-nav-toggle");
      await trigger.focus();
      panel = page.locator("#projects-primary-navigation");
      await panel.waitFor({ state: "visible" });
    } else {
      await page.getByRole("button", { name: "Open navigation", exact: true }).press("Enter");
      panel = page.locator("#mobile-navigation");
    }
    await panel.getByRole("link", { name: "Account", exact: true }).click();
    await page.getByRole("heading", { name, exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No mobile overflow");
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: direct routes, keyboard signup/login/logout, reload persistence, invalid credentials, private-error state, Studio account/cart navigation`);
    await context.close();
  }
} finally {
  await browser.close();
  const ids = (await pool.query("SELECT id FROM users WHERE username=ANY($1::text[])", [created])).rows.map(row => String(row.id));
  await pool.query("DELETE FROM auth_sessions WHERE data->>'accountId'=ANY($1::text[])", [ids]);
  await pool.query("DELETE FROM users WHERE username=ANY($1::text[])", [created]);
  await pool.end();
}
