
import axios, { AxiosInstance } from 'axios';

const PRINTFUL_API_BASE = 'https://api.printful.com';

class PrintfulClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: PRINTFUL_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Get store info
  async getStoreInfo() {
    const response = await this.client.get('/store');
    return response.data;
  }

  // Get all products
  async getProducts() {
    const response = await this.client.get('/store/products');
    return response.data;
  }

  // Get product by ID
  async getProduct(productId: number) {
    const response = await this.client.get(`/store/products/${productId}`);
    return response.data;
  }

  // Get product variants
  async getProductVariants(productId: number) {
    const response = await this.client.get(`/store/products/${productId}`);
    return response.data;
  }

  // Get catalog products
  async getCatalogProducts(params?: {
    category_id?: number;
    offset?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/products', { params });
    return response.data;
  }

  // Get catalog variant by ID
  async getCatalogVariant(variantId: number) {
    const response = await this.client.get(`/products/variant/${variantId}`);
    return response.data;
  }

  // Calculate shipping rates
  async calculateShipping(params: {
    recipient: {
      address1: string;
      city: string;
      country_code: string;
      state_code?: string;
      zip: string;
    };
    items: Array<{
      variant_id: number;
      quantity: number;
    }>;
    currency?: string;
    locale?: string;
  }) {
    const response = await this.client.post('/shipping/rates', params);
    return response.data;
  }

  // Create order
  async createOrder(orderData: {
    recipient: {
      name: string;
      address1: string;
      city: string;
      country_code: string;
      state_code?: string;
      zip: string;
      email?: string;
      phone?: string;
    };
    items: Array<{
      sync_variant_id?: number;
      external_variant_id?: string;
      variant_id?: number;
      quantity: number;
      files?: Array<{
        url: string;
      }>;
    }>;
    retail_costs?: {
      currency: string;
      subtotal: string;
      discount?: string;
      shipping: string;
      tax?: string;
    };
  }) {
    const response = await this.client.post('/orders', orderData);
    return response.data;
  }

  // Get orders
  async getOrders(params?: {
    status?: string;
    offset?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }

  // Get order by ID
  async getOrder(orderId: number | string) {
    const response = await this.client.get(`/orders/@${orderId}`);
    return response.data;
  }

  // Confirm order for fulfillment
  async confirmOrder(orderId: number | string) {
    const response = await this.client.post(`/orders/@${orderId}/confirm`);
    return response.data;
  }

  // Get webhook configuration
  async getWebhookConfig() {
    const response = await this.client.get('/webhooks');
    return response.data;
  }

  // Set up webhook
  async setupWebhook(url: string, types: string[]) {
    const response = await this.client.post('/webhooks', {
      url,
      types,
    });
    return response.data;
  }
}

// Singleton instance
let printfulClient: PrintfulClient | null = null;

export function getPrintfulClient(): PrintfulClient {
  const apiKey = process.env.PRINTFUL_API_KEY;
  
  if (!apiKey) {
    throw new Error('PRINTFUL_API_KEY environment variable is not set');
  }

  if (!printfulClient) {
    printfulClient = new PrintfulClient(apiKey);
  }

  return printfulClient;
}

export default PrintfulClient;
