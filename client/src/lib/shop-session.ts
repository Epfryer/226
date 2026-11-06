// A per-tab capability works in an embedded preview even when third-party cookies
// are blocked, and survives the same-tab round trip through hosted checkout.
export function shopHeaders(): Record<string, string> {
  let token = sessionStorage.getItem("shop-owner-token");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    token = Array.from(bytes, n => n.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem("shop-owner-token", token);
  }
  return { "X-Shop-Token": token };
}
