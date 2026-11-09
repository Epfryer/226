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
  await sendInquiryEmail(inquiry, "D.EF <inquiries@example.com>", async (path, options) => {
    request = { path, options: options as { method: string; body: any } };
    return new Response(null, { status: 200 });
  });

  assert.equal(request?.path, "/emails/batch");
  assert.equal(request?.options.method, "POST");
  const emails = request?.options.body as any[];
  assert.equal(emails.length, 2);
  assert.equal(emails[0].from, "D.EF <inquiries@example.com>");
  assert.deepEqual(emails[0].to, ["Epfryer@me.com"]);
  assert.equal(emails[0].reply_to, "visitor@example.com");
  assert.equal(emails[0].subject, "New Collaborations inquiry from Test Sender");
  assert.match(emails[0].text, /What role or contribution do you have in mind\? A design collaboration/);
  assert.match(emails[0].text, /A sufficiently long inquiry for the test\./);

  const reference = emails[0].text.match(/Inquiry reference: (DEF-[A-F0-9]{8})/)?.[1];
  assert.ok(reference, "owner notification includes a unique reference");
  assert.equal(emails[1].from, "D.EF <inquiries@example.com>");
  assert.deepEqual(emails[1].to, ["visitor@example.com"]);
  assert.equal(emails[1].reply_to, "Epfryer@me.com");
  assert.equal(emails[1].subject, "We received your D.EF inquiry");
  assert.match(emails[1].html, /Hi Test,/);
  assert.ok(emails[1].html.includes(reference));
  assert.match(emails[1].html, /Received/);
  assert.ok(!emails[1].html.includes("{{"));
});

test("provider failures return a safe delivery error", async () => {
  await assert.rejects(
    sendInquiryEmail(inquiry, "inquiries@example.com", async () => new Response(null, { status: 403 })),
    /email service could not send/i,
  );
});

test("missing sender is rejected before contacting Resend", async () => {
  let contacted = false;
  await assert.rejects(
    sendInquiryEmail(inquiry, "", async () => {
      contacted = true;
      return new Response(null, { status: 200 });
    }),
    /sender is not configured/i,
  );
  assert.equal(contacted, false);
});

test("receipt values are escaped before insertion into the HTML template", () => {
  const html = renderInquiryReceipt({
    firstName: "<script>alert(1)</script>",
    inquiryId: "DEF-00000001",
    receivedDate: "November 9, 2026",
  });
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("{{"));
});
