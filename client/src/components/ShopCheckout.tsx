import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, Check, Clock3, LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { trackEvent } from "@/lib/analytics";
import { shopHeaders } from "@/lib/shop-session";

export interface CheckoutCartItem {
  variantId: number;
  syncVariantId: number;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

interface Recipient {
  name: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

interface Quote {
  quoteId: string;
  expiresAt: string;
  items: CheckoutCartItem[];
  subtotal: number | string;
  shippingRates: ShippingRate[];
}

interface ShopStatus {
  ready: boolean;
  testMode: boolean;
  message: string;
}

interface Verification {
  success: boolean;
  paid: boolean;
  status: string;
  message: string;
  testMode: boolean;
  tracking?: { url?: string; number?: string; carrier?: string };
}

interface ShopCheckoutProps {
  isOpen: boolean;
  cart: CheckoutCartItem[];
  sessionId?: string | null;
  onClose: () => void;
  onPaid: (submittedItems: CheckoutCartItem[]) => void;
}

const countries = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"],
  ["DE", "Germany"], ["FR", "France"], ["IT", "Italy"], ["ES", "Spain"], ["NL", "Netherlands"],
  ["BE", "Belgium"], ["AT", "Austria"], ["CH", "Switzerland"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["FI", "Finland"], ["IE", "Ireland"], ["PT", "Portugal"], ["PL", "Poland"],
  ["CZ", "Czechia"], ["JP", "Japan"], ["KR", "South Korea"], ["SG", "Singapore"], ["HK", "Hong Kong"],
  ["NZ", "New Zealand"],
] as const;

const emptyRecipient: Recipient = {
  name: "", email: "", address1: "", address2: "", city: "", state_code: "", country_code: "US", zip: "",
};

function money(amount: number | string, currency = "USD") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(Number.isFinite(value) ? value : 0);
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function deliveryWindow(rate: ShippingRate) {
  if (!rate.minDeliveryDays && !rate.maxDeliveryDays) return null;
  if (rate.minDeliveryDays && rate.maxDeliveryDays) return `${rate.minDeliveryDays}–${rate.maxDeliveryDays} business days`;
  return `${rate.minDeliveryDays || rate.maxDeliveryDays} business days`;
}

function StatusPanel({
  sessionId,
  onPaid,
}: {
  sessionId: string;
  onPaid: (items: CheckoutCartItem[]) => void;
}) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const paidHandled = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;
  const submittedItems = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(`shop-checkout:${sessionId}`);
      return stored ? JSON.parse(stored) as CheckoutCartItem[] : [];
    } catch {
      return [];
    }
  }, [sessionId]);

  const verify = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/shop/checkout/${encodeURIComponent(sessionId)}/verify`, { credentials: "include", headers: shopHeaders() });
      if (!response.ok) throw new Error(await readError(response, "We could not check this order right now."));
      const result = await response.json() as Verification;
      if (!result || typeof result.paid !== "boolean" || typeof result.status !== "string") {
        throw new Error("The order status response was incomplete. Please try again.");
      }
      setVerification(result);
      if (result.paid && !paidHandled.current) {
        paidHandled.current = true;
        onPaidRef.current(submittedItems);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not check this order right now.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, submittedItems]);

  useEffect(() => {
    paidHandled.current = false;
    setVerification(null);
    void verify();
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const poll = async () => {
      if (cancelled || Date.now() - startedAt >= 30_000) return;
      const response = await fetch(`/api/shop/checkout/${encodeURIComponent(sessionId)}/verify`, { credentials: "include", headers: shopHeaders() }).catch(() => null);
      if (response?.ok) {
        const result = await response.json().catch(() => null) as Verification | null;
        if (result && typeof result.paid === "boolean" && typeof result.status === "string") {
          setVerification(result);
          setError("");
          if (result.paid && !paidHandled.current) {
            paidHandled.current = true;
            onPaidRef.current(submittedItems);
          }
        }
      }
      if (!cancelled && Date.now() - startedAt < 30_000) timer = setTimeout(poll, 3000);
    };
    timer = setTimeout(poll, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId, verify]);

  const status = verification?.status || "awaiting_payment";
  const isPaid = verification?.paid === true;
  const statusLabel: Record<string, string> = {
    awaiting_payment: "Awaiting payment", paid: "Payment received", processing: "Preparing your order",
    fulfilled: "Accepted for production", shipped: "On its way", needs_attention: "Needs attention",
    test_paid: "Test payment received", canceled: "Checkout canceled",
  };

  return (
    <section aria-labelledby="checkout-status-title" className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`grid h-11 w-11 shrink-0 place-items-center border ${isPaid ? "border-emerald-800/30 bg-emerald-50 text-emerald-800" : "border-amber-800/20 bg-amber-50 text-amber-800"}`}>
          {isPaid ? <Check className="h-5 w-5" /> : loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Clock3 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Checkout status</p>
          <h2 id="checkout-status-title" className="mt-1 font-serif text-2xl">{statusLabel[status] || status.replaceAll("_", " ")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {verification?.message || "We’re checking for a confirmed payment. This can take a moment."}
          </p>
        </div>
      </div>
      {!isPaid && (
        <div role="status" className="border-l-2 border-amber-700/50 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
          Payment has not been verified yet. Your cart remains saved; please don’t place a duplicate order.
        </div>
      )}
      {verification?.testMode && <p className="text-xs text-muted-foreground">This checkout is running in test mode.</p>}
      {status === "needs_attention" && <a href="/about#contact" className="inline-block text-sm underline underline-offset-4">Contact us about this order</a>}
      {verification?.tracking && (
        <div className="border-t border-border pt-4 text-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Tracking</p>
          {verification.tracking.carrier && <p className="mt-2">{verification.tracking.carrier}</p>}
          {verification.tracking.number && <p className="font-mono text-xs">{verification.tracking.number}</p>}
          {verification.tracking.url && <a className="mt-2 inline-block underline underline-offset-4" href={verification.tracking.url} target="_blank" rel="noreferrer">Track shipment</a>}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-[11px] text-muted-foreground">Session reference <span className="font-mono">{sessionId}</span></span>
        <button type="button" onClick={() => void verify()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 border border-foreground/25 px-3 text-xs uppercase tracking-wider hover:bg-muted disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh status
        </button>
      </div>
      {error && <div role="alert" className="flex items-start gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    </section>
  );
}

export default function ShopCheckout({ isOpen, cart, sessionId, onClose, onPaid }: ShopCheckoutProps) {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const [recipient, setRecipient] = useState<Recipient>(emptyRecipient);
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const hasSession = Boolean(sessionId);
  const expired = Boolean(quote && new Date(quote.expiresAt).getTime() <= now);
  const selectedRate = quote?.shippingRates.find(rate => rate.id === selectedShipping);
  const subtotal = Number(quote?.subtotal ?? 0);
  const total = subtotal + Number(selectedRate?.rate ?? 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!isOpen || hasSession) return;
    let active = true;
    fetch("/api/shop/status", { credentials: "include" })
      .then(async response => {
        if (!response.ok) throw new Error(await readError(response, "Shop status is unavailable."));
        return response.json() as Promise<ShopStatus>;
      })
      .then(result => { if (active) setStatus(result); })
      .catch(reason => { if (active) setStatusError(reason instanceof Error ? reason.message : "Shop status is unavailable."); });
    return () => { active = false; };
  }, [hasSession, isOpen]);

  useEffect(() => {
    if (!quote) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [quote]);

  useEffect(() => {
    if (!isOpen) {
      setQuote(null);
      setQuoteError("");
      setSelectedShipping("");
      setRecipient(emptyRecipient);
      setStatus(null);
      setStatusError("");
      setIsRedirecting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const updateRecipient = (key: keyof Recipient) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRecipient(current => ({ ...current, [key]: event.target.value }));
  };

  const requestQuote = async (event: FormEvent) => {
    event.preventDefault();
    setIsQuoting(true);
    setQuoteError("");
    setQuote(null);
    setSelectedShipping("");
    try {
      const response = await fetch("/api/shop/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...shopHeaders() },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map(item => ({ syncVariantId: item.syncVariantId, quantity: item.quantity })),
          recipient: {
            name: recipient.name.trim(), email: recipient.email.trim(), address1: recipient.address1.trim(),
            ...(recipient.address2.trim() ? { address2: recipient.address2.trim() } : {}),
            city: recipient.city.trim(), ...(recipient.state_code.trim() ? { state_code: recipient.state_code.trim() } : {}),
            country_code: recipient.country_code, zip: recipient.zip.trim(),
          },
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "We couldn’t get shipping options. Please check the address and try again."));
      const result = await response.json() as Quote;
      if (!result.quoteId || !result.expiresAt || !Array.isArray(result.items) || !Array.isArray(result.shippingRates)) {
        throw new Error("Shipping options were incomplete. Please try again.");
      }
      setQuote(result);
      setSelectedShipping(result.shippingRates[0]?.id || "");
      setNow(Date.now());
    } catch (reason) {
      trackEvent("checkout_failed");
      setQuoteError(reason instanceof Error ? reason.message : "We couldn’t get shipping options. Please try again.");
    } finally {
      setIsQuoting(false);
    }
  };

  const pay = async () => {
    if (!quote || !selectedShipping || expired || !status?.ready || isRedirecting) return;
    setIsRedirecting(true);
    setQuoteError("");
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...shopHeaders() },
        credentials: "include",
        body: JSON.stringify({ quoteId: quote.quoteId, shippingId: selectedShipping }),
      });
      if (!response.ok) throw new Error(await readError(response, "We couldn’t open secure checkout. Please try again."));
      const result = await response.json() as { url?: string; sessionId?: string };
      if (!result.url || !result.sessionId) throw new Error("Secure checkout did not return a session. Please try again.");
      try { sessionStorage.setItem(`shop-checkout:${result.sessionId}`, JSON.stringify(quote.items)); } catch { /* session verification still works without local storage */ }
      const checkoutData = { item_count: quote.items.reduce((sum, item) => sum + item.quantity, 0), value: Number((subtotal + Number(selectedRate?.rate || 0)).toFixed(2)), currency: selectedRate?.currency || "USD" };
      trackEvent("checkout_redirected", checkoutData);
      window.location.assign(result.url);
    } catch (reason) {
      trackEvent("checkout_failed");
      setQuoteError(reason instanceof Error ? reason.message : "We couldn’t open secure checkout. Please try again.");
      setIsRedirecting(false);
    }
  };

  if (!isOpen) return null;
  const fieldClass = "mt-1.5 min-h-11 w-full border border-border bg-background px-3 text-sm outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground/20";
  const labelClass = "block text-[10px] uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget && !hasSession) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="shop-checkout-title" className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden bg-background text-foreground shadow-2xl sm:max-h-[90dvh] sm:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Ethan Fryer · Studio shop</p>
              <h1 id="shop-checkout-title" className="mt-1 font-serif text-2xl tracking-tight">{hasSession ? "Your order" : "Shipping details"}</h1>
            </div>
            <button type="button" onClick={onClose} aria-label="Close checkout" className="grid h-10 w-10 place-items-center hover:bg-muted"><X className="h-5 w-5" /></button>
          </header>

          <div className="p-5 sm:p-8">
            {hasSession ? (
              <StatusPanel sessionId={sessionId!} onPaid={onPaid} />
            ) : (
              <>
                {statusError && (
                  <div role="alert" className="mb-5 flex items-start gap-2 border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="flex-1">{statusError}</span>
                    <button type="button" className="shrink-0 underline underline-offset-4" onClick={async () => {
                      setStatusError("");
                      try {
                        const response = await fetch("/api/shop/status", { credentials: "include" });
                        if (!response.ok) throw new Error(await readError(response, "Shop status is unavailable."));
                        setStatus(await response.json() as ShopStatus);
                      } catch (reason) {
                        setStatusError(reason instanceof Error ? reason.message : "Shop status is unavailable.");
                      }
                    }}>Retry</button>
                  </div>
                )}
                {status && (status.message || status.testMode || !status.ready) && (
                  <div className={`mb-5 flex items-start gap-2 border p-3 text-sm ${status.ready ? "border-amber-800/20 bg-amber-50/70 text-amber-950" : "border-destructive/30 bg-destructive/5"}`}>
                    {status.ready ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                    <span>{status.message || (!status.ready ? "Checkout is temporarily unavailable." : status.testMode ? "Test mode is enabled; no real payment will be collected." : "Secure checkout is ready.")}{status.testMode && status.message ? " Test mode is enabled; no real payment will be collected." : ""}</span>
                  </div>
                )}
                {!status && !statusError && <div aria-label="Checking shop availability" className="mb-5 h-14 animate-pulse bg-muted/60" />}
                {quote ? (
                  <div className="space-y-7">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Shipping options</p>
                        <p className="mt-1 text-sm">Choose a delivery method for this address.</p>
                      </div>
                      <button type="button" onClick={() => { setQuote(null); setSelectedShipping(""); }} className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-wider underline underline-offset-4">
                        <ArrowLeft className="h-3.5 w-3.5" /> Edit address
                      </button>
                    </div>
                    {expired ? (
                      <div role="alert" className="border border-amber-800/25 bg-amber-50/70 p-4 text-sm text-amber-950">
                        This shipping quote expired. Request a fresh quote before continuing.
                        <button type="button" onClick={() => setQuote(null)} className="ml-2 underline underline-offset-4">Requote</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Quote expires in {Math.max(0, Math.ceil((new Date(quote.expiresAt).getTime() - now) / 60000))} min</div>
                    )}
                    {quote.shippingRates.length === 0 ? <div className="border border-border p-4 text-sm">No shipping services are available for this address. Edit your details and try again.</div> : (
                      <fieldset className="space-y-2">
                        <legend className="sr-only">Choose shipping service</legend>
                        {quote.shippingRates.map(rate => (
                          <label key={rate.id} className={`flex cursor-pointer items-center gap-3 border p-4 transition ${selectedShipping === rate.id ? "border-foreground bg-muted/50" : "border-border hover:border-foreground/50"}`}>
                            <input type="radio" name="shipping-method" value={rate.id} checked={selectedShipping === rate.id} onChange={() => setSelectedShipping(rate.id)} className="h-4 w-4 accent-foreground" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{rate.name}</span>
                              {deliveryWindow(rate) && <span className="mt-1 block text-xs text-muted-foreground">{deliveryWindow(rate)}</span>}
                            </span>
                            <span className="font-mono text-sm">{money(rate.rate, rate.currency)}</span>
                          </label>
                        ))}
                      </fieldset>
                    )}
                    {quoteError && <p role="alert" className="text-sm text-destructive">{quoteError}</p>}
                    <button type="button" onClick={() => void pay()} disabled={!status?.ready || !selectedRate || expired || isRedirecting} className="flex min-h-12 w-full items-center justify-center gap-2 bg-foreground px-5 text-xs uppercase tracking-[0.15em] text-background transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40">
                      {isRedirecting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Opening secure checkout</> : <>Continue to payment <span aria-hidden="true">→</span></>}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={requestQuote} className="space-y-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">01 / Delivery address</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">We’ll use these details to calculate available shipping services. Payment is completed securely with Stripe.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>Full name<input className={fieldClass} autoComplete="name" required value={recipient.name} onChange={updateRecipient("name")} /></label>
                      <label className={labelClass}>Email address<input className={fieldClass} type="email" autoComplete="email" required value={recipient.email} onChange={updateRecipient("email")} /></label>
                      <label className={`${labelClass} sm:col-span-2`}>Address<input className={fieldClass} autoComplete="address-line1" required value={recipient.address1} onChange={updateRecipient("address1")} /></label>
                      <label className={`${labelClass} sm:col-span-2`}>Apartment, suite, etc. <span className="normal-case tracking-normal">(optional)</span><input className={fieldClass} autoComplete="address-line2" value={recipient.address2} onChange={updateRecipient("address2")} /></label>
                      <label className={labelClass}>City<input className={fieldClass} autoComplete="address-level2" required value={recipient.city} onChange={updateRecipient("city")} /></label>
                      <label className={labelClass}>State / region<input className={fieldClass} autoComplete="address-level1" value={recipient.state_code} onChange={updateRecipient("state_code")} /></label>
                      <label className={labelClass}>Postal code<input className={fieldClass} autoComplete="postal-code" required value={recipient.zip} onChange={updateRecipient("zip")} /></label>
                      <label className={labelClass}>Country
                        <select className={fieldClass} autoComplete="country" required value={recipient.country_code} onChange={updateRecipient("country_code")}>
                          {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                        </select>
                      </label>
                    </div>
                    {quoteError && <div role="alert" className="flex items-start gap-2 border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{quoteError}</div>}
                    <button type="submit" disabled={isQuoting || cart.length === 0} className="flex min-h-12 w-full items-center justify-center gap-2 bg-foreground px-5 text-xs uppercase tracking-[0.15em] text-background transition hover:opacity-85 disabled:opacity-50">
                      {isQuoting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Finding shipping options</> : <>Continue to shipping <span aria-hidden="true">→</span></>}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {!hasSession && (
          <aside className="max-h-[34vh] shrink-0 overflow-y-auto border-t border-border bg-muted/25 p-5 sm:max-h-none sm:w-[310px] sm:border-l sm:border-t-0 sm:p-7">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Your selection · {itemCount} {itemCount === 1 ? "piece" : "pieces"}</p>
            <div className="mt-5 space-y-4">
              {(quote?.items || cart).map(item => (
                <div key={item.syncVariantId} className="flex gap-3">
                  {item.image && <img src={item.image} alt="" className="h-14 w-12 shrink-0 object-cover bg-muted" />}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium">{item.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{item.color} / {item.size} · Qty {item.quantity}</p>
                  </div>
                  <span className="whitespace-nowrap font-mono text-xs">{money(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{money(quote ? subtotal : cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-mono">{selectedRate ? money(selectedRate.rate, selectedRate.currency) : "Calculated next"}</span></div>
              {quote && <div className="flex justify-between border-t border-border pt-3 font-medium"><span>Total</span><span className="font-mono">{money(total, selectedRate?.currency || "USD")}</span></div>}
              <p className="text-[10px] leading-5 text-muted-foreground">Taxes calculated at checkout.</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
