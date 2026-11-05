import assert from "node:assert/strict";
import { verifyGlassReader, waitForReader } from "./reader-checks.mjs";
const { chromium, firefox, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

function pdfFixture() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Count 30 /Kids [${Array.from({length:30},(_,i)=>`${4+i*2} 0 R`).join(" ")}] >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (let i=0;i<30;i++) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5+i*2} 0 R >>`);
    const text = `BT /F1 24 Tf 50 700 Td (Test publication page ${i+1}) Tj ET`;
    objects.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
  }
  let out="%PDF-1.4\n"; const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${object}\nendobj\n`;});
  const xref=out.length;
  out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(n=>out+=`${String(n).padStart(10,"0")} 00000 n \n`);
  return Buffer.from(out+`trailer\n<< /Root 1 0 R /Size ${objects.length+1} >>\nstartxref\n${xref}\n%%EOF`);
}
const failures=[];
for (const [name, engine] of Object.entries({chromium,firefox,webkit})) {
  if (process.env.TEST_BROWSER && name !== process.env.TEST_BROWSER) continue;
  let browser;
  try {
    const executablePath=process.env[`${name.toUpperCase()}_PATH`];
    browser=await engine.launch({headless:true, ...(executablePath ? {executablePath} : {})});
    for(const width of [390,1440]) {
      const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,ignoreHTTPSErrors:process.env.TEST_IGNORE_HTTPS_ERRORS==="1"});
      const page=await context.newPage();
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      await page.route("**/api/publications",r=>r.fulfill({json:{publications:[{slug:"test",title:"Test publication",year:"2026",filename:"test.pdf",pdfPath:"/api/publications/test.pdf",coverPath:""}]}}));
      await page.route("**/api/publications/test.pdf",r=>r.fulfill({contentType:"application/pdf",body:pdfFixture()}));
      await page.route("**/api/shop/products",r=>r.fulfill({json:{result:[]}}));
      if (!process.env.TEST_READER_ONLY) {
      for(const path of ["/","/about","/projects","/contact","/publications","/studio"]) {
        await page.goto(base+path);
        await page.locator("main").first().waitFor();
        await page.waitForTimeout(400);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} ${width} overflow ${path}`);
        assert.equal(await page.locator("a a").count(),0);
      }
      // Persistence/canceled return without invoking a payment provider.
      await page.evaluate(()=>localStorage.setItem("def-studio-cart-v1",JSON.stringify([{syncVariantId:1,variantId:2,name:"Saved print",quantity:2,price:25,color:"Black",size:"A4",image:""}])));
      await page.goto(base+"/studio?canceled=true");
      await page.getByRole("button",{name:/cart/i}).first().click();
      await page.getByRole("dialog",{name:"Shopping cart"}).waitFor();
      assert(await page.getByText("Saved print").isVisible());
      await page.route("**/api/shop/cart/validate",r=>r.fulfill({json:{items:[{syncVariantId:1,variantId:2,name:"Saved print",quantity:2,price:30,color:"Black",size:"A4",image:""}]}}));
      await page.getByRole("button",{name:"Proceed to Checkout"}).click();
      await page.getByText("Prices updated",{exact:true}).waitFor();
      assert(await page.getByText("$60.00",{exact:true}).count()>0);
      await page.keyboard.press("Escape");
      await page.getByRole("dialog",{name:"Shopping cart"}).waitFor({state:"hidden"});
      await page.route("**/api/shop/checkout/test-session/verify",r=>r.fulfill({json:{success:true}}));
      await page.goto(base+"/studio?success=true&session_id=test-session");
      await page.waitForFunction(()=>localStorage.getItem("def-studio-cart-v1")==="[]");
      }
      await page.goto(base+"/publications?doc=test");
      await page.getByRole("dialog").waitFor();
      await verifyGlassReader(page,name,width);
      await page.evaluate(()=>sessionStorage.setItem("pdf-page-/api/publications/test.pdf","27"));
      await page.getByRole("button",{name:/Open Test publication/}).click();
      await waitForReader(page);
      for(let i=0;i<4;i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(900); }
      const last=await page.evaluate(()=>Number(sessionStorage.getItem("pdf-page-/api/publications/test.pdf")));
      assert(last>=29 && last<=30,"Last-page navigation must remain bounded");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({state:"hidden"});
      // A failed PDF is recoverable without closing the new full-window reader.
      await page.route("**/api/publications/test.pdf",r=>r.fulfill({status:503,body:"Temporarily unavailable"}));
      await page.getByRole("button",{name:/Open Test publication/}).click();
      await page.getByText("Failed to Load PDF",{exact:true}).waitFor();
      await page.route("**/api/publications/test.pdf",async r=>{
        await new Promise(resolve=>setTimeout(resolve,500));
        await r.fulfill({contentType:"application/pdf",body:pdfFixture()});
      });
      await page.getByRole("button",{name:"Try Again",exact:true}).click();
      await waitForReader(page);
      await page.getByRole("button",{name:"Close publication"}).click();
      await page.getByRole("dialog").waitFor({state:"hidden"});
      assert.equal(errors.length,0,errors.join("\n"));
      console.log(`PASS ${name} ${width}: glass viewport, unclipped zoom, pan, keyboard/focus, pinch (Chromium phone), resize, reading recovery, boundaries, PDF error/retry${process.env.TEST_READER_ONLY ? "" : ", routes and cart"}`);
      await context.close();
    }
  } catch(error) { failures.push(`${name}: ${error.message}`); console.error(failures.at(-1)); }
  finally { await browser?.close(); }
}
if(failures.length) process.exitCode=1;
