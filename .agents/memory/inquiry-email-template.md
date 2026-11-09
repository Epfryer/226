---
name: Inquiry email template
description: How inquiry receipts and studio notifications use the supplied email template.
---

Use the supplied D.EF HTML as the submitter's receipt. Send a separate studio notification containing the inquiry category, the category-specific answer, and the full details. Do not send the customer-facing receipt to the studio as its commission brief.

**Why:** The supplied HTML is a submitter acknowledgment, and the connected Resend integration is send-only; its remote template lookup failed. The uploaded HTML is the available source for the receipt.

**How to apply:** Keep the inquiry receipt and studio notification as separate messages. Avoid adding broad Resend access to the application just to retrieve a template; if remote retrieval is needed, first arrange authorized full-access read capability.
