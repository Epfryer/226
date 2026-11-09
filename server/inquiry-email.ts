import { ReplitConnectors } from "@replit/connectors-sdk";
import { randomUUID } from "node:crypto";
import { renderInquiryReceipt } from "./inquiry-email-template";

export interface InquiryEmail {
  type: string;
  name: string;
  email: string;
  organization: string;
  specificAnswer: string;
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

  const questions: Record<string, string> = {
    Commissions: "Where is the project located?",
    Collaborations: "What role or contribution do you have in mind?",
    "Studio inquiries": "What would you like to explore with the studio?",
    "Press / features": "Which outlet is this for, and when is your deadline?",
  };

  const reference = `DEF-${randomUUID().slice(0, 8).toUpperCase()}`;
  const receivedDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());

  const response = await proxy("/emails/batch", {
    method: "POST",
    body: [
      {
        from,
        to: ["Epfryer@me.com"],
        reply_to: inquiry.email,
        subject: `New ${inquiry.type} inquiry from ${inquiry.name}`,
        text: [
          `Inquiry reference: ${reference}`,
          `Inquiry type: ${inquiry.type}`,
          `Name: ${inquiry.name}`,
          `Email: ${inquiry.email}`,
          `Organization: ${inquiry.organization || "Not provided"}`,
          `${questions[inquiry.type] ?? "Inquiry details"} ${inquiry.specificAnswer}`,
          "",
          inquiry.details,
        ].join("\n"),
      },
      {
        from,
        to: [inquiry.email],
        reply_to: "Epfryer@me.com",
        subject: "We received your D.EF inquiry",
        html: renderInquiryReceipt({
          firstName: inquiry.name.trim().split(/\s+/)[0],
          fullName: inquiry.name,
          email: inquiry.email,
          inquiryType: inquiry.type,
          organization: inquiry.organization || "Not provided",
          specificQuestion: questions[inquiry.type] ?? "Inquiry details",
          specificAnswer: inquiry.specificAnswer,
          details: inquiry.details,
          inquiryId: reference,
          receivedDate,
          responseTime: "72 hours",
        }),
      },
    ],
  });

  if (!response.ok) {
    console.error("[Inquiries] Email provider rejected the request", response.status);
    throw new Error("The email service could not send your inquiry. Please try again later.");
  }
}
