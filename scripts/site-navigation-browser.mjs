import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
const routes = ["/", "/about", "/projects", "/publications", "/project/Corp0rate-Circus", "/studio"];

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const route of routes) {
      await page.goto(base + route);
      await page.locator("header.portfolio-header").waitFor();
      assert.equal(await page.locator("header.portfolio-header").count(), 1, `One shared header on ${route}`);
      assert.equal(await page.locator("main").first().evaluate(element => getComputedStyle(element).paddingLeft), "0px", `No obsolete sidebar space on ${route}`);
      let panel;
      if (width >= 768) {
        const toggle = page.locator("header .projects-nav-toggle");
        panel = page.locator(`[id="${await toggle.getAttribute("aria-controls")}"]`);
        await toggle.hover();
        await panel.waitFor({ state: "visible" });
        assert.equal(await panel.getByRole("link").count(), 4, `All navigation destinations on ${route}`);
        if (route === "/about") {
          const colors = await panel.evaluate(element => ({
            background: getComputedStyle(element).backgroundColor,
            text: getComputedStyle(element.querySelector("a")).color,
          }));
          assert.equal(colors.text, "rgb(255, 255, 255)", "White links remain legible on About");
          assert.notEqual(colors.background, "rgba(255, 255, 255, 0.97)", "About dropdown has a dark background");
        }
        await panel.getByRole("link", { name: "About", exact: true }).focus();
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden" });
        assert(await toggle.evaluate(element => element === document.activeElement), "Escape restores trigger focus");
        await page.mouse.move(width - 20, 150);
        await toggle.press("Enter");
        await panel.waitFor({ state: "visible" });
      } else {
        const toggle = page.getByRole("button", { name: "Open navigation", exact: true });
        if (route === "/studio") {
          const cart = await page.getByRole("button", { name: "Open cart", exact: true }).boundingBox();
          const menu = await toggle.boundingBox();
          assert(cart.x + cart.width <= menu.x || menu.x + menu.width <= cart.x, "Cart and mobile menu do not overlap");
        }
        await toggle.click();
        panel = page.locator("#mobile-navigation");
        await panel.waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        await panel.waitFor({ state: "hidden" });
        await toggle.click();
        await panel.waitFor({ state: "visible" });
      }
      const destination = route === "/about" ? "Projects" : "About";
      await panel.getByRole("link", { name: destination, exact: true }).click();
      await page.waitForURL(new RegExp(`/${destination.toLowerCase()}$`));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No horizontal overflow after navigation from ${route}`);
      console.log(`PASS ${width}px ${route}: shared menu, links, keyboard/dismissal, no sidebar gap`);
    }
    await page.goto(base + "/about#contact");
    const contact = page.locator("section#contact");
    await contact.getByRole("heading", { name: "Reach out if you want to build something thoughtful." }).waitFor();
    assert.equal(await contact.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
    assert.equal(await contact.getByRole("link", { name: "Epfryer@me.com" }).getAttribute("href"), "mailto:Epfryer@me.com");
    assert.equal(await contact.getByRole("link", { name: "+1 (813) 505-0290" }).getAttribute("href"), "tel:+18135050290");
    const timeline = page.getByRole("heading", { name: "Timeline of My Journey" });
    assert(await timeline.evaluate(element => document.querySelector("section#contact").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING));
    assert(await contact.evaluate(element => element.getBoundingClientRect().top < innerHeight), "Contact anchor reaches the block");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "About contact does not overflow");
    assert.equal((await page.request.get(base + "/contact")).status(), 404);
    await page.goto(base + "/studio");
    await page.getByRole("button", { name: "Open cart", exact: true }).click();
    const cart = page.getByRole("dialog", { name: "Shopping cart", exact: true });
    await cart.waitFor();
    assert(await cart.getByText("Your cart is empty", { exact: true }).isVisible(), "Studio cart remains functional");
    await cart.getByRole("button", { name: "Close cart", exact: true }).click();
    await cart.waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
}
