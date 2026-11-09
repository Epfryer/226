import { ReplitConnectors } from "@replit/connectors-sdk";

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
  templateId = process.env.INQUIRY_TEMPLATE_ID,
) {
  if (!from) throw new Error("Inquiry email sender is not configured");
  if (!templateId) throw new Error("Inquiry email template is not configured");

  const questions: Record<string, string> = {
    Commissions: "Where is the project located?",
    Collaborations: "What role or contribution do you have in mind?",
    "Studio inquiries": "What would you like to explore with the studio?",
    "Press / features": "Which outlet is this for, and when is your deadline?",
  };

  const response = await proxy("/emails", {
    method: "POST",
    body: {
      from,
      to: ["Epfryer@me.com"],
      cc: [inquiry.email],
      reply_to: inquiry.email,
      subject: `New ${inquiry.type} inquiry from ${inquiry.name}`,
      template: {
        id: templateId,
        variables: {
          INQUIRY_TYPE: inquiry.type,
          INQUIRER_NAME: inquiry.name,
          INQUIRER_EMAIL: inquiry.email,
          ORGANIZATION: inquiry.organization || "Not provided",
          SPECIFIC_QUESTION: questions[inquiry.type] ?? "Inquiry details",
          SPECIFIC_ANSWER: inquiry.specificAnswer,
          DETAILS: inquiry.details,
        },
      },
    },
  });

  if (!response.ok) {
    console.error("[Inquiries] Email provider rejected the request", response.status);
    throw new Error("The email service could not send your inquiry. Please try again later.");
  }
}
