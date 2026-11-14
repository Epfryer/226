import { AsyncCache } from "./async-cache";
import { getPrintfulClient } from "./printful";

type CatalogProvider = Pick<ReturnType<typeof getPrintfulClient>, "getProducts" | "getProduct">;
const providers = new WeakMap<CatalogProvider, {
  list: AsyncCache<string, any>; details: AsyncCache<number, any>;
}>();
function cache(provider: CatalogProvider) {
  let value = providers.get(provider);
  if (!value) {
    value = { list: new AsyncCache(60_000, 1), details: new AsyncCache(60_000, 100) };
    providers.set(provider, value);
  }
  return value;
}
// Retain the full provider envelope for the API; documents project from it.
export function loadCatalog(provider = getPrintfulClient()) {
  return cache(provider).list.get("products", async () => {
    const response = await provider.getProducts();
    if (!Array.isArray(response?.result)) throw new Error("Product catalog unavailable");
    return response;
  });
}
export function loadProduct(id: number, provider = getPrintfulClient()) {
  return cache(provider).details.get(id, async () => {
    const response = await provider.getProduct(id);
    if (!response?.result?.sync_product || !Array.isArray(response.result.sync_variants)) {
      throw new Error("Product unavailable");
    }
    return response;
  });
}
