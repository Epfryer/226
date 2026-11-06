export async function validateCart(items: unknown, getVariant: (id: number) => Promise<any>) {
  if (!Array.isArray(items) || !items.length || items.length > 30) throw new Error("Invalid cart");
  const seen = new Set<number>();
  const result = [];
  for (const item of items) {
    if (!Number.isSafeInteger(item?.syncVariantId) || item.syncVariantId <= 0 ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Invalid cart quantity");
    if (seen.has(item.syncVariantId)) throw new Error("Duplicate cart variant");
    seen.add(item.syncVariantId);
    const response = await getVariant(item.syncVariantId);
    const variant = response?.result?.sync_variant;
    const price = Number(variant?.retail_price);
    if (!variant?.synced || variant.currency !== "USD" ||
        !["active", "available"].includes(variant.availability_status) ||
        !Number.isFinite(price) || price <= 0) throw new Error("An item is unavailable. Remove it from your cart and try again.");
    result.push({
      syncVariantId: variant.id, variantId: variant.variant_id, quantity: item.quantity,
      name: variant.name, color: variant.color || "", size: variant.size || "", price,
      image: variant.files?.find((file: any) => file.type === "preview")?.preview_url || variant.product?.image || "",
    });
  }
  return result;
}
