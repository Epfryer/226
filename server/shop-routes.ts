
import { type Express } from "express";
import { getPrintfulClient } from "./printful";

export function registerShopRoutes(app: Express) {
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
          // Handle shipment notification
          break;
        case 'package_returned':
          console.log("Package returned:", data);
          // Handle return notification
          break;
        case 'order_failed':
          console.log("Order failed:", data);
          // Handle order failure
          break;
        case 'order_canceled':
          console.log("Order canceled:", data);
          // Handle order cancellation
          break;
        case 'product_synced':
          console.log("Product synced:", data);
          // Handle product sync
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
}
