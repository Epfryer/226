import { ReplitConnectors } from "@replit/connectors-sdk";

export interface InquiryEmail {
  type: string;
  name: string;
  email: string;
  organization: string;
  details: string;
}

type ProxyRequest = (path: string, options: {
  method: string;
  body: unknown;
}) => Promise<Response>;

const resendProxy: ProxyRequest = (path, options) =>
  new ReplitConnectors().proxy("resend", path, options);

export async function sendInquiryEmail(
  inquiry: InquiryEmail,
  from = process.env.INQUIRY_FROM_EMAIL,
  proxy: ProxyRequest = resendProxy,
) {
  if (!from) throw new Error("Inquiry email sender is not configured");

  const response = await proxy("/emails", {
    method: "POST",
    body: {
      from,
      to: ["Epfryer@me.com"],
      cc: [inquiry.email],
      reply_to: inquiry.email,
      subject: `New ${inquiry.type} inquiry from ${inquiry.name}`,
      text: [
        `Inquiry type: ${inquiry.type}`,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Organization: ${inquiry.organization || "Not provided"}`,
        "",
        inquiry.details,
      ].join("\n"),
    },
  });

  if (!response.ok) {
    console.error("[Inquiries] Email provider rejected the request", response.status);
    throw new Error("The email service could not send your inquiry. Please try again later.");
  }
}
