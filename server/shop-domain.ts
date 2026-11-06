import { z } from "zod";

export const supportedCountries = ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "IE", "PT", "PL", "CZ", "JP", "KR", "SG", "HK", "NZ"] as const;
const field = z.string().trim().min(1).max(150);
export const recipientSchema = z.object({
  name: field,
  email: z.string().trim().email().max(254),
  address1: field,
  address2: z.string().trim().max(150).optional().default(""),
  city: field,
  state_code: z.string().trim().max(60).optional().default(""),
  country_code: z.enum(supportedCountries),
  zip: z.string().trim().min(1).max(20),
}).superRefine((value, ctx) => {
  if (["US", "CA", "AU"].includes(value.country_code) && !value.state_code) {
    ctx.addIssue({ code: "custom", path: ["state_code"], message: "State or province is required" });
  }
});
export type Recipient = z.infer<typeof recipientSchema>;
export type ShopItem = {
  syncVariantId: number; variantId: number; quantity: number;
  name: string; color: string; size: string; price: number; image: string;
};
export type ShippingRate = {
  id: string; name: string; rate: string; currency: string;
  minDeliveryDays?: number; maxDeliveryDays?: number;
};
export function cents(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") throw new Error("Invalid price");
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000 ||
    (typeof value === "string" && !/^\d+(\.\d{1,2})?$/.test(value)) ||
    Math.abs(n * 100 - Math.round(n * 100)) > 0.000001) throw new Error("Invalid price");
  return Math.round(n * 100);
}
export function normalizeRates(response: any): ShippingRate[] {
  if (!Array.isArray(response?.result)) throw new Error("Shipping rates unavailable");
  const rates = response.result.filter((r: any) => r.currency === "USD").map((r: any) => {
    cents(r.rate);
    if (!r.id || !r.name) throw new Error("Invalid shipping rate");
    return {
      id: String(r.id), name: String(r.name), rate: String(r.rate), currency: "USD",
      minDeliveryDays: r.minDeliveryDays ?? r.min_delivery_days,
      maxDeliveryDays: r.maxDeliveryDays ?? r.max_delivery_days,
    };
  });
  if (!rates.length) throw new Error("No shipping service is available for this address");
  return rates;
}
export function publicOrder(order: any) {
  const messages: Record<string, string> = {
    awaiting_payment: "Waiting for payment confirmation.",
    paid: "Payment received. Preparing your order.",
    processing: "Payment received. Submitting your order to production.",
    fulfilled: "Your order has been accepted for production.",
    shipped: "Your order has shipped.",
    needs_attention: "Payment received, but fulfillment needs attention. Do not pay again. Contact us with your order reference.",
    test_paid: "Test payment verified. No physical order was placed or charged by Printful.",
    canceled: order.paid ? "Your order is on hold or canceled. Contact us with your reference." : "Checkout expired or was canceled. You have not placed an order.",
  };
  return {
    success: true, paid: order.paid, status: order.status, testMode: order.test_mode,
    message: messages[order.status] || "Checking your order.",
    tracking: order.tracking || undefined,
  };
}
