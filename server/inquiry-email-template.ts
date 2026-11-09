export interface InquiryReceiptData {
  firstName: string;
  fullName: string;
  email: string;
  inquiryType: string;
  organization: string;
  specificQuestion: string;
  specificAnswer: string;
  details: string;
  inquiryId: string;
  receivedDate: string;
  responseTime: string;
}

const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>IMPORTANT [D.EF]</title>
</head>
<body style="background-color:#f0efeb;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#222222">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
    We received your work inquiry. Reply here anytime to add details.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0efeb">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff">
        <tr><td style="padding:24px 28px;background:#171717;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:2px">D.EF</td></tr>
        <tr><td style="padding:32px 28px;font-size:16px;line-height:1.6">
          <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#555555">WORK INQUIRY</p>
          <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2">Thanks for reaching out.</h1>
          <p style="margin:0 0 16px">Hi {{first_name}},</p>
          <p style="margin:0 0 16px">Thank you for taking the time to share this with me. I appreciate you thinking of D.EF, and I’ll review your note carefully.</p>
          <p style="margin:0 0 24px">I expect to get back to you within <strong>{{response_time}}</strong>. I’ll reply in this email thread.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4f0;margin:0 0 28px">
            <tr><td style="padding:18px 20px;font-size:15px;line-height:1.5;overflow-wrap:anywhere">
              <strong>Inquiry reference</strong><br />{{inquiry_id}}<br /><br />
              <strong>Received</strong><br />{{received_date}}
            </td></tr>
          </table>
          <h2 style="margin:0 0 14px;font-size:18px;line-height:1.3">Your responses</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4f0">
            <tr><td style="padding:18px 20px;font-size:14px;line-height:1.6;overflow-wrap:anywhere">
              <p style="margin:0 0 12px"><strong>Inquiry type</strong><br />{{inquiry_type}}</p>
              <p style="margin:0 0 12px"><strong>Name</strong><br />{{full_name}}</p>
              <p style="margin:0 0 12px"><strong>Email</strong><br />{{email}}</p>
              <p style="margin:0 0 12px"><strong>Organization</strong><br />{{organization}}</p>
              <p style="margin:0 0 12px"><strong>{{specific_question}}</strong><br />{{specific_answer}}</p>
              <p style="margin:0"><strong>Additional details</strong><br /><span style="white-space:pre-wrap">{{details}}</span></p>
            </td></tr>
          </table>
          <p style="margin:24px 0 20px"><strong>Need to follow up sooner?</strong> Reply directly to this email and include your inquiry reference. You can also reply with a correction, timeline, or anything else you’d like me to consider.</p>
          <p style="margin:0 0 20px">Thanks again,<br /><strong>Ethan<br />D.EF</strong></p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#555555">ON THE WEB</p>
          <p style="margin:0 0 14px"><a href="https://ethanfryer.com" style="color:#171717;text-decoration:underline">ethanfryer.com</a></p>
          <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#555555">SOCIALS</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding:0">
                <a href="https://www.instagram.com/fryer_21/" aria-label="Instagram" title="Instagram" style="display:block;width:28px;height:28px;line-height:28px;background:#171717;color:#ffffff;text-align:center;text-decoration:none;font-size:18px;font-weight:bold">◎</a>
              </td>
              <td style="width:8px"></td>
              <td style="padding:0">
                <a href="https://www.facebook.com/ethan.fryer.927/" aria-label="Facebook" title="Facebook" style="display:block;width:28px;height:28px;line-height:28px;background:#171717;color:#ffffff;text-align:center;text-decoration:none;font-size:19px;font-weight:bold">f</a>
              </td>
              <td style="width:8px"></td>
              <td style="padding:0">
                <a href="https://www.linkedin.com/in/epfryer/" aria-label="LinkedIn" title="LinkedIn" style="display:block;width:28px;height:28px;line-height:28px;background:#171717;color:#ffffff;text-align:center;text-decoration:none;font-size:13px;font-weight:bold">in</a>
              </td>
              <td style="width:8px"></td>
              <td aria-label="X" style="width:28px;height:28px;background:#171717;color:#ffffff;text-align:center;font-size:16px;font-weight:bold">X</td>
            </tr>
          </table>
          <p style="margin:8px 0 0;font-size:12px;color:#666666">X profile coming soon.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export function renderInquiryReceipt(data: InquiryReceiptData) {
  return receiptHtml
    .replaceAll("{{first_name}}", escapeHtml(data.firstName))
    .replaceAll("{{full_name}}", escapeHtml(data.fullName))
    .replaceAll("{{email}}", escapeHtml(data.email))
    .replaceAll("{{inquiry_type}}", escapeHtml(data.inquiryType))
    .replaceAll("{{organization}}", escapeHtml(data.organization))
    .replaceAll("{{specific_question}}", escapeHtml(data.specificQuestion))
    .replaceAll("{{specific_answer}}", escapeHtml(data.specificAnswer))
    .replaceAll("{{details}}", escapeHtml(data.details))
    .replaceAll("{{inquiry_id}}", escapeHtml(data.inquiryId))
    .replaceAll("{{received_date}}", escapeHtml(data.receivedDate))
    .replaceAll("{{response_time}}", escapeHtml(data.responseTime));
}
