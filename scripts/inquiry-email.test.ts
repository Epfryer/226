import assert from "node:assert/strict";
import test from "node:test";
import { sendInquiryEmail } from "../server/inquiry-email";

const inquiry = {
  type: "Collaborations",
  name: "Test Sender",
  email: "visitor@example.com",
  organization: "Example Studio",
  details: "A sufficiently long inquiry for the test.",
};

test("inquiry email sends through the connected Resend integration", async () => {
  let request: { path: string; options: { method: string; body: any } } | undefined;
  await sendInquiryEmail(inquiry, "D.EF <inquiries@example.com>", async (path, options) => {
    request = { path, options: options as { method: string; body: any } };
    return new Response(null, { status: 200 });
  });

  assert.equal(request?.path, "/emails");
  assert.equal(request?.options.method, "POST");
  assert.deepEqual(request?.options.body, {
    from: "D.EF <inquiries@example.com>",
    to: ["Epfryer@me.com"],
    cc: ["visitor@example.com"],
    reply_to: "visitor@example.com",
    subject: "New Collaborations inquiry from Test Sender",
    text: "Inquiry type: Collaborations\nName: Test Sender\nEmail: visitor@example.com\nOrganization: Example Studio\n\nA sufficiently long inquiry for the test.",
  });
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
