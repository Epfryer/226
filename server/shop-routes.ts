
import { type Express } from "express";
import { getPrintfulClient } from "./printful";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

function isPrintfulConfigured(): boolean {
  return !!process.env.PRINTFUL_API_KEY;
}

interface CartItem {
  syncVariantId: number;
  variantId: number;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export function registerShopRoutes(app: Express) {
  // Check if Printful is configured
  if (!isPrintfulConfigured()) {
    console.warn("[Shop] Printful not configured - shop routes will return empty results");
    
    // Register placeholder routes that return empty results
    app.get("/api/shop/products", (req, res) => {
      res.json({ code: 200, result: [], message: "Shop not configured" });
    });
    
    app.get("/api/shop/products/:id", (req, res) => {
      res.status(404).json({ error: "Shop not configured" });
    });
    
    return;
  }

  const printful = getPrintfulClient();

  // Get all products
  app.get("/api/shop/products", async (req, res) => {
    try {
      const products = await printful.getProducts();
      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ 
        error: "Failed to fetch products",
        message: error.message 
      });
    }
  });

  // Get single product
  app.get("/api/shop/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await printful.getProduct(productId);
      res.json(product);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      res.status(500).json({ 
        error: "Failed to fetch product",
        message: error.message 
      });
    }
  });

  // Get catalog products (Printful's product catalog)
  app.get("/api/shop/catalog", async (req, res) => {
    try {
      const { category_id, offset, limit } = req.query;
      const params: any = {};
      
      if (category_id) params.category_id = parseInt(category_id as string);
      if (offset) params.offset = parseInt(offset as string);
      if (limit) params.limit = parseInt(limit as string);
      
      const catalog = await printful.getCatalogProducts(params);
      res.json(catalog);
    } catch (error: any) {
      console.error("Error fetching catalog:", error);
      res.status(500).json({ 
        error: "Failed to fetch catalog",
        message: error.message 
      });
    }
  });

  // Get catalog variant
  app.get("/api/shop/catalog/variant/:id", async (req, res) => {
    try {
      const variantId = parseInt(req.params.id);
      const variant = await printful.getCatalogVariant(variantId);
      res.json(variant);
    } catch (error: any) {
      console.error("Error fetching variant:", error);
      res.status(500).json({ 
        error: "Failed to fetch variant",
        message: error.message 
      });
    }
  });

  // Calculate shipping
  app.post("/api/shop/shipping/calculate", async (req, res) => {
    try {
      const shippingRates = await printful.calculateShipping(req.body);
      res.json(shippingRates);
    } catch (error: any) {
      console.error("Error calculating shipping:", error);
      res.status(500).json({ 
        error: "Failed to calculate shipping",
        message: error.message 
      });
    }
  });

  // Create order
  app.post("/api/shop/orders", async (req, res) => {
    try {
      const order = await printful.createOrder(req.body);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        error: "Failed to create order",
        message: error.message 
      });
    }
  });

  // Get orders
  app.get("/api/shop/orders", async (req, res) => {
    try {
      const { status, offset, limit } = req.query;
      const params: any = {};
      
      if (status) params.status = status as string;
      if (offset) params.offset = parseInt(offset as string);
      if (limit) params.limit = parseInt(limit as string);
      
      const orders = await printful.getOrders(params);
      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ 
        error: "Failed to fetch orders",
        message: error.message 
      });
    }
  });

  // Get single order
  app.get("/api/shop/orders/:id", async (req, res) => {
    try {
      const order = await printful.getOrder(req.params.id);
      res.json(order);
    } catch (error: any) {
      console.error("Error fetching order:", error);
      res.status(500).json({ 
        error: "Failed to fetch order",
        message: error.message 
      });
    }
  });

  // Confirm order
  app.post("/api/shop/orders/:id/confirm", async (req, res) => {
    try {
      const result = await printful.confirmOrder(req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error("Error confirming order:", error);
      res.status(500).json({ 
        error: "Failed to confirm order",
        message: error.message 
      });
    }
  });

  // Webhook endpoint (for Printful to send updates)
  app.post("/api/shop/webhook", async (req, res) => {
    try {
      console.log("Printful webhook received:", req.body);
      
      // Handle different webhook types
      const { type, data } = req.body;
      
      switch (type) {
        case 'package_shipped':
          console.log("Package shipped:", data);
          break;
        case 'package_returned':
          console.log("Package returned:", data);
          break;
        case 'order_failed':
          console.log("Order failed:", data);
          break;
        case 'order_canceled':
          console.log("Order canceled:", data);
          break;
        case 'product_synced':
          console.log("Product synced:", data);
          break;
        default:
          console.log("Unknown webhook type:", type);
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ 
        error: "Failed to process webhook",
        message: error.message 
      });
    }
  });

  // Get Stripe publishable key for frontend
  app.get("/api/shop/stripe-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error getting Stripe key:", error);
      res.status(500).json({ 
        error: "Failed to get Stripe key",
        message: error.message 
      });
    }
  });

  // Create Stripe checkout session
  app.post("/api/shop/checkout", async (req, res) => {
    try {
      const { items, shippingAddress } = req.body as {
        items: CartItem[];
        shippingAddress?: {
          name: string;
          email: string;
          address1: string;
          city: string;
          state_code: string;
          country_code: string;
          zip: string;
        };
      };

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in cart" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Create line items for Stripe checkout
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: `${item.color} / ${item.size}`,
            images: item.image ? [item.image] : [],
            metadata: {
              syncVariantId: item.syncVariantId.toString(),
              variantId: item.variantId.toString(),
              color: item.color,
              size: item.size,
            }
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      // Get host for success/cancel URLs
      const host = req.headers.origin || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ', 'JP', 'KR', 'SG', 'HK', 'NZ'],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 499, currency: 'usd' },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 5 },
                maximum: { unit: 'business_day', value: 10 },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 999, currency: 'usd' },
              display_name: 'Express Shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 2 },
                maximum: { unit: 'business_day', value: 5 },
              },
            },
          },
        ],
        success_url: `${host}/studio?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${host}/studio?canceled=true`,
        metadata: {
          cartItems: JSON.stringify(items.map(i => ({
            syncVariantId: i.syncVariantId,
            variantId: i.variantId,
            name: i.name,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
          }))),
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ 
        error: "Failed to create checkout session",
        message: error.message 
      });
    }
  });

  // Verify checkout session and create Printful order
  app.get("/api/shop/checkout/:sessionId/verify", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer_details'],
      }) as any;

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Parse cart items from metadata with full variant details
      interface CartItemMeta {
        syncVariantId: number;
        variantId: number;
        name: string;
        color: string;
        size: string;
        quantity: number;
      }
      
      const cartItems: CartItemMeta[] = JSON.parse(session.metadata?.cartItems || '[]');
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "No items found in order" });
      }
      
      // Extract shipping address - try multiple possible locations
      let shippingAddress = session.shipping_details?.address;
      let shippingName = session.shipping_details?.name;
      
      // Fallback to customer_details if shipping_details not available
      if (!shippingAddress && session.customer_details?.address) {
        shippingAddress = session.customer_details.address;
        shippingName = session.customer_details.name;
      }
      
      // Check for collected_information (newer Stripe API)
      if (!shippingAddress && session.collected_information?.shipping_details?.address) {
        shippingAddress = session.collected_information.shipping_details.address;
        shippingName = session.collected_information.shipping_details.name;
      }
      
      if (!shippingAddress || !shippingAddress.line1) {
        console.error("No valid shipping address found in session:", sessionId);
        return res.status(400).json({ 
          error: "No shipping address provided",
          details: "Please contact support with your order confirmation."
        });
      }

      // Create Printful order with full variant details
      const orderItems = cartItems.map((item) => ({
        sync_variant_id: item.syncVariantId,
        quantity: item.quantity,
      }));

      console.log("Creating Printful order with items:", orderItems);
      console.log("Shipping to:", shippingAddress);

      const printfulOrder = await printful.createOrder({
        recipient: {
          name: shippingName || session.customer_details?.name || 'Customer',
          address1: shippingAddress.line1,
          city: shippingAddress.city || '',
          state_code: shippingAddress.state || '',
          country_code: shippingAddress.country || 'US',
          zip: shippingAddress.postal_code || '',
          email: session.customer_details?.email || '',
        },
        items: orderItems,
      });

      console.log("Printful order created:", printfulOrder);

      res.json({ 
        success: true, 
        order: printfulOrder,
        session: {
          id: session.id,
          status: session.payment_status,
          total: session.amount_total,
        }
      });
    } catch (error: any) {
      console.error("Error verifying checkout:", error);
      
      // Return more detailed error for debugging
      res.status(500).json({ 
        error: "Failed to verify checkout",
        message: error.message,
        details: "Your payment was received. If your order doesn't appear, please contact support."
      });
    }
  });
}
