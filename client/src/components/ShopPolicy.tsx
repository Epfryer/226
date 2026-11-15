export const policyPaths = ["/terms", "/privacy-policy", "/return-policy"] as const;
export type PolicyPath = typeof policyPaths[number];

export function isPolicyPath(path: string): path is PolicyPath {
  return (policyPaths as readonly string[]).includes(path);
}

export function ShopPolicy({ path }: { path: PolicyPath }) {
  const title = path === "/terms" ? "Terms of service" : path === "/privacy-policy" ? "Privacy policy" : "Refund and return policy";
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-6 py-24 text-base leading-7">
      <header>
        <p className="text-xs uppercase tracking-widest">D.EF Studio</p>
        <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
      </header>
      <p role="note" className="border border-amber-700/40 bg-amber-50 p-4 text-sm text-amber-950">
        Draft for owner review. This is not a final policy and should not be submitted to Stripe or relied on for purchases.
      </p>
      {path === "/terms" ? <>
        <section><h2 className="text-xl font-semibold">Orders and payment</h2>
          <p>Products and availability are displayed in the studio shop. Shipping options and prices are shown before payment; applicable taxes are calculated at checkout. Stripe processes payment on its hosted checkout page.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Fulfillment</h2>
          <p>Orders are fulfilled by Printful. Delivery estimates are not guarantees. Please review your delivery details before submitting an order.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Returns and questions</h2>
          <p>See the <a className="underline" href="/return-policy">refund and return policy draft</a>. For order questions, <a className="underline" href="/about#contact">contact D.EF</a>.</p>
        </section>
        <p className="text-sm">Owner review needed: business identity, jurisdiction, applicable consumer terms, and final return terms.</p>
      </> : path === "/privacy-policy" ? <>
        <section><h2 className="text-xl font-semibold">Shop information</h2>
          <p>When you request shipping or place an order, the shop collects your name, email, delivery address, and order details. This information is used to calculate shipping, process payment, and fulfill or support your order.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Service providers</h2>
          <p>Stripe provides payment processing, Printful provides shipping estimates and order fulfillment, and Resend sends order emails. Information needed for those services is shared with the relevant provider.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Optional email updates</h2>
          <p>If you opt in at checkout, we store your email and consent to send updates, releases and offers fewer than two times per week. You can unsubscribe using the link in a marketing email or by contacting D.EF.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Browser storage</h2>
          <p>The shop uses browser storage and an ownership token to retain the cart and associate checkout status with the browser that started it.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Questions</h2>
          <p>For privacy questions, <a className="underline" href="/about#contact">contact D.EF</a>.</p>
        </section>
        <p className="text-sm">Owner review needed: all site-wide data collection and providers, cookies and analytics, retention, privacy rights, and applicable disclosures.</p>
      </> : <>
        <section><h2 className="text-xl font-semibold">Order issues</h2>
          <p>If an order arrives damaged, defective, or incorrect, <a className="underline" href="/about#contact">contact D.EF</a> with your order reference and a description of the problem. Please do not send an item back until return instructions have been provided.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Changes and cancellations</h2>
          <p>Contact D.EF promptly if you need to change or cancel an order. Once production begins, changes may not be possible.</p>
        </section>
        <section><h2 className="text-xl font-semibold">Refunds and returns</h2>
          <p>The owner must determine and publish the eligibility conditions, request deadline, return address, shipping costs, and refund timing before this policy is final. Applicable consumer rights must be respected.</p>
        </section>
      </>}
    </article>
  );
}
