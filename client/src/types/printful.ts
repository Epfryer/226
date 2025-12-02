
export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  warehouse_product_variant_id: number | null;
  retail_price: string;
  sku: string;
  currency: string;
  is_ignored: boolean;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: Array<{
    id: number;
    type: string;
    hash: string;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    dpi: number;
    status: string;
    created: number;
    thumbnail_url: string;
    preview_url: string;
    visible: boolean;
  }>;
  options: Array<{
    id: string;
    value: string | number;
  }>;
}

export interface PrintfulCatalogProduct {
  id: number;
  main_category_id: number;
  type: string;
  description: string;
  type_name: string;
  title: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  files: Array<{
    id: string;
    type: string;
    title: string;
    additional_price: string | null;
  }>;
  options: Array<{
    id: string;
    title: string;
    type: string;
    values: Record<string, string>;
    additional_price: string | null;
  }>;
  dimensions: {
    product_size_x: string;
    product_size_y: string;
    product_size_z: string;
    printfile_size_x: string;
    printfile_size_y: string;
  };
  is_discontinued: boolean;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  store: number;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code?: string;
    state_name?: string;
    country_code: string;
    country_name: string;
    zip: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    id: number;
    external_id?: string;
    variant_id?: number;
    sync_variant_id?: number;
    external_variant_id?: string;
    quantity: number;
    price: string;
    retail_price?: string;
    name: string;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
  }>;
  retail_costs?: {
    currency: string;
    subtotal: string;
    discount?: string;
    shipping: string;
    tax?: string;
    total: string;
  };
}
