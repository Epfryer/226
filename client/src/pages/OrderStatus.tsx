import { useCallback, useEffect, useState } from "react";

type OrderStatusResult = {
  paid: boolean;
  status: string;
  message: string;
  testMode: boolean;
  refreshUnavailable: boolean;
  tracking?: { number: string; carrier?: string; url?: string };
};

function readToken() {
  const fragment = window.location.hash.slice(1);
  if (fragment) return /^[a-f0-9]{64}$/.test(fragment) ? fragment : "";
  try { return sessionStorage.getItem("shop-order-status-token") || ""; }
  catch { console.warn("Order status link could not be read from this tab."); return ""; }
}

export default function OrderStatus() {
  const [token] = useState(readToken);
  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!/^[a-f0-9]{64}$/.test(token)) { setError("Open the private order status link from your receipt."); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shop/order-status", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error(response.status === 404 ? "This order status link is invalid or unavailable." : "Order status is temporarily unavailable. Please try again.");
      const data: OrderStatusResult = await response.json();
      if (typeof data.status !== "string" || typeof data.message !== "string" || typeof data.paid !== "boolean") {
        throw new Error("Order status is temporarily unavailable. Please try again.");
      }
      setResult(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order status is temporarily unavailable. Please try again.");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const labels: Record<string, string> = {
    awaiting_payment: "Awaiting payment", paid: "Payment received", processing: "Preparing your order",
    fulfilled: "Accepted for production", shipped: "Shipped", needs_attention: "Needs attention",
    test_paid: "Test payment received", canceled: "Order canceled",
  };
  const trackingUrl = result?.tracking?.url;
  const safeTrackingUrl = trackingUrl && /^https:\/\//i.test(trackingUrl) ? trackingUrl : undefined;
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <p className="text-[10px] uppercase tracking-[.22em] text-foreground/55">D.EF / Studio shop</p>
      <h1 className="mt-4 font-serif text-4xl">Your order status</h1>
      <p className="mt-3 text-sm text-foreground/65">This link is private. Anyone with it can view this order’s status.</p>
      {loading && !result && <p role="status" className="mt-8 text-sm">Checking your order…</p>}
      {result && (
        <div className="mt-8 space-y-6 border border-border p-6" aria-live="polite">
          <div>
            <p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Current status</p>
            <h2 className="mt-2 font-serif text-2xl">{labels[result.status] || "Checking your order"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.message}</p>
          </div>
          <div className="border-t border-border pt-5 text-sm">
            <p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">Tracking</p>
            {result.tracking ? (
              <div className="mt-2 space-y-1">
                {result.tracking.carrier && <p>{result.tracking.carrier}</p>}
                <p className="break-all font-mono">{result.tracking.number}</p>
                {safeTrackingUrl && <a className="inline-block underline underline-offset-4" href={safeTrackingUrl} target="_blank" rel="noreferrer">Track shipment</a>}
              </div>
            ) : <p className="mt-2 text-muted-foreground">Tracking is not available yet.</p>}
          </div>
          {result.refreshUnavailable && <p role="status" className="text-sm text-amber-800">We could not refresh shipping details. The information shown may be out of date; please try again.</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-12 border border-foreground px-5 text-xs uppercase tracking-[.15em] hover:bg-muted disabled:opacity-50">
          {loading ? "Checking…" : "Refresh status"}
        </button>
        <a href="mailto:support@ethanfryer.com" className="text-sm underline underline-offset-4">Contact support</a>
      </div>
    </section>
  );
}
