export interface InquiryReceiptData {
  firstName: string;
  inquiryId: string;
  receivedDate: string;
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
          <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2">We received your inquiry.</h1>
          <p style="margin:0 0 16px">Hi {{first_name}},</p>
          <p style="margin:0 0 24px">Thanks for reaching out to D.EF about working together. We’ll review what you shared and follow up in this email thread.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4f0">
            <tr><td style="padding:18px 20px;font-size:15px;line-height:1.5;overflow-wrap:anywhere">
              <strong>Inquiry reference</strong><br />{{inquiry_id}}<br /><br />
              <strong>Received</strong><br />{{received_date}}
            </td></tr>
          </table>
          <p style="margin:24px 0 20px"><strong>Have something to add?</strong> Reply directly to this email with any updates, a timeline, or links that would help us understand the project.</p>
          <p style="margin:0">Thanks,<br /><strong>D.EF</strong></p>
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
    .replaceAll("{{inquiry_id}}", escapeHtml(data.inquiryId))
    .replaceAll("{{received_date}}", escapeHtml(data.receivedDate));
}
