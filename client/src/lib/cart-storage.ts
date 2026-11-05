const KEY = "def-studio-cart-v1";
export function readCart(): any[] {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(items)) return [];
    return items.slice(0, 30).filter(item => Number.isSafeInteger(item?.syncVariantId) &&
      item.syncVariantId > 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99)
      .map(item => ({
        syncVariantId: item.syncVariantId, variantId: Number(item.variantId) || 0,
        quantity: item.quantity, price: Number(item.price) || 0,
        name: String(item.name || ""), color: String(item.color || ""), size: String(item.size || ""), image: String(item.image || ""),
      }));
  } catch { return []; }
}
export function saveCart(items: unknown[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* Browsing still works without storage. */ }
}
