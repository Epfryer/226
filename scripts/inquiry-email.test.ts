import assert from "node:assert/strict";
import test from "node:test";
import { sendInquiryEmail } from "../server/inquiry-email";
import { renderInquiryReceipt } from "../server/inquiry-email-template";

const inquiry = {
  type: "Collaborations",
  name: "Test Sender",
  email: "visitor@example.com",
  organization: "Example Studio",
  specificAnswer: "A design collaboration",
  details: "A sufficiently long inquiry for the test.",
};

test("inquiry email sends through the connected Resend integration", async () => {
  let request: { path: string; options: { method: string; body: any } } | undefined;
  await sendInquiryEmail(inquiry, "D.EF <inquiry@ethanfryer.com>", async (path, options) => {
    request = { path, options: options as { method: string; body: any } };
    return new Response(null, { status: 200 });
  });

  assert.equal(request?.path, "/emails/batch");
  assert.equal(request?.options.method, "POST");
  const emails = request?.options.body as any[];
  assert.equal(emails.length, 2);
  assert.equal(emails[0].from, "D.EF <inquiry@ethanfryer.com>");
  assert.deepEqual(emails[0].to, ["inquiry@ethanfryer.com"]);
  assert.equal(emails[0].reply_to, "visitor@example.com");
  assert.equal(emails[0].subject, "New Collaborations inquiry from Test Sender");
  assert.match(emails[0].text, /What role or contribution do you have in mind\? A design collaboration/);
  assert.match(emails[0].text, /A sufficiently long inquiry for the test\./);

  const reference = emails[0].text.match(/Inquiry reference: (DEF-[A-F0-9]{8})/)?.[1];
  assert.ok(reference, "owner notification includes a unique reference");
  assert.equal(emails[1].from, "D.EF <inquiry@ethanfryer.com>");
  assert.deepEqual(emails[1].to, ["visitor@example.com"]);
  assert.equal(emails[1].reply_to, "inquiry@ethanfryer.com");
  assert.equal(emails[1].subject, "We received your D.EF inquiry");
  assert.match(emails[1].html, /Hi Test,/);
  assert.ok(emails[1].html.includes(reference));
  assert.ok(emails[1].html.includes("Test Sender"));
  assert.ok(emails[1].html.includes("visitor@example.com"));
  assert.ok(emails[1].html.includes("Collaborations"));
  assert.ok(emails[1].html.includes("Example Studio"));
  assert.ok(emails[1].html.includes("A design collaboration"));
  assert.ok(emails[1].html.includes("A sufficiently long inquiry for the test."));
  assert.match(emails[1].html, /within <strong>72 hours<\/strong>/);
  assert.match(emails[1].html, /https:\/\/ethanfryer\.com/);
  assert.match(emails[1].html, /href="https:\/\/www\.facebook\.com\/ethan\.fryer\.927\/"/);
  assert.match(emails[1].html, /href="https:\/\/www\.instagram\.com\/fryer_21\/"/);
  assert.match(emails[1].html, /href="https:\/\/www\.linkedin\.com\/in\/epfryer\/"/);
  assert.match(emails[1].html, /X profile coming soon/);
  assert.ok(!emails[1].html.includes("{{"));
});

test("provider failures return a safe delivery error", async () => {
  await assert.rejects(
    sendInquiryEmail(inquiry, "inquiry@ethanfryer.com", async () => new Response(null, { status: 403 })),
    /email service could not send/i,
  );
});

test("missing or incorrect sender is rejected before contacting Resend", async () => {
  let contacted = false;
  await assert.rejects(
    sendInquiryEmail(inquiry, "", async () => {
      contacted = true;
      return new Response(null, { status: 200 });
    }),
    /sender must be configured as inquiry@ethanfryer.com/i,
  );
  await assert.rejects(
    sendInquiryEmail(inquiry, "D.EF <support@ethanfryer.com>", async () => {
      contacted = true;
      return new Response(null, { status: 200 });
    }),
    /sender must be configured as inquiry@ethanfryer.com/i,
  );
  assert.equal(contacted, false);
});

test("the configured inquiry sender is used independently of the shop sender", async () => {
  const previous = process.env.INQUIRY_FROM_EMAIL;
  const previousShop = process.env.SHOP_FROM_EMAIL;
  try {
    process.env.INQUIRY_FROM_EMAIL = "D.EF Studio <inquiry@ethanfryer.com>";
    process.env.SHOP_FROM_EMAIL = "D.EF Studio <support@ethanfryer.com>";
    await sendInquiryEmail(inquiry, undefined, async (_path, options) => {
      const emails = options.body as { from: string; reply_to: string }[];
      assert.equal(emails[1].from, process.env.INQUIRY_FROM_EMAIL);
      assert.equal(emails[1].reply_to, "inquiry@ethanfryer.com");
      return new Response(null, { status: 200 });
    });
    delete process.env.INQUIRY_FROM_EMAIL;
    await assert.rejects(sendInquiryEmail(inquiry, undefined, async () => new Response()), /inquiry@ethanfryer.com/);
  } finally {
    if (previous === undefined) delete process.env.INQUIRY_FROM_EMAIL;
    else process.env.INQUIRY_FROM_EMAIL = previous;
    if (previousShop === undefined) delete process.env.SHOP_FROM_EMAIL;
    else process.env.SHOP_FROM_EMAIL = previousShop;
  }
});

test("receipt values are escaped before insertion into the HTML template", () => {
  const html = renderInquiryReceipt({
    firstName: "<script>alert(1)</script>",
    fullName: "Test <b>person</b>",
    email: "test@example.com",
    inquiryType: "Commissions",
    organization: "Example",
    specificQuestion: "Where is the project?",
    specificAnswer: "A city",
    details: "The project details.",
    inquiryId: "DEF-00000001",
    receivedDate: "November 9, 2026",
    responseTime: "72 hours",
  });
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("Test &lt;b&gt;person&lt;/b&gt;"));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("{{"));
});
