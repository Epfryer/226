import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client } from '@replit/object-storage';
import multer from 'multer';
import { uploadPdf, deletePdf, getPdfMetadata } from './storage';
import pdfRoutes from './pdf-routes';
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, isPayPalConfigured } from "./paypal";
import { loadPublications } from "./public-content";
import { z } from "zod";

const inquirySchema = z.object({
  type: z.enum(["Commissions", "Collaborations", "Studio inquiries", "Press / features"]),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  organization: z.string().trim().max(160).default(""),
  details: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional().default(""),
});

const inquiryRateLimits = new Map<string, { count: number; until: number }>();

function isInquiryRateLimited(ip: string) {
  const now = Date.now();
  if (inquiryRateLimits.size > 5000) {
    inquiryRateLimits.forEach((value, key) => {
      if (value.until < now) inquiryRateLimits.delete(key);
    });
  }
  const bucket = inquiryRateLimits.get(ip);
  if (!bucket || bucket.until < now) {
    inquiryRateLimits.set(ip, { count: 1, until: now + 15 * 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 5;
}

async function sendInquiryEmail(inquiry: z.infer<typeof inquirySchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INQUIRY_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Inquiry email delivery is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: ["Epfryer@me.com"],
      cc: [inquiry.email],
      reply_to: inquiry.email,
      subject: `New ${inquiry.type} inquiry from ${inquiry.name}`,
      text: [
        `Inquiry type: ${inquiry.type}`,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Organization: ${inquiry.organization || "Not provided"}`,
        "",
        inquiry.details,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error("[Inquiries] Email provider rejected the request", response.status);
    throw new Error("The email service could not send your inquiry. Please try again later.");
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export function registerRoutes(app: Express): Server {
  // CORS middleware for API routes - allow all origins
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });

  app.post("/api/inquiries", async (req, res) => {
    const parsed = inquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please check your details and try again." });
    }
    if (isInquiryRateLimited(req.ip || req.socket.remoteAddress || "unknown")) {
      return res.status(429).json({ error: "Too many inquiries have been sent. Please try again later." });
    }
    if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_FROM_EMAIL) {
      return res.status(503).json({ error: "Inquiry email is not available right now. Please email Epfryer@me.com directly." });
    }

    try {
      await sendInquiryEmail(parsed.data);
      return res.json({ sent: true });
    } catch (error) {
      console.error("[Inquiries] Delivery failed", error instanceof Error ? error.message : "Unknown email error");
      return res.status(502).json({
        error: error instanceof Error ? error.message : "Your inquiry could not be sent. Please try again later.",
      });
    }
  });

  // Upload PDF endpoint
  app.post("/api/publications/upload", upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const metadata = {
        originalName: req.file.originalname,
        uploadedBy: req.body.uploadedBy || 'anonymous',
        title: req.body.title || req.file.originalname,
        year: req.body.year || new Date().getFullYear().toString()
      };

      const result = await uploadPdf(
        req.file.buffer,
        req.file.originalname,
        metadata
      );

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({
        message: 'PDF uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  });

  // List all PDFs with download URLs
  app.get("/api/publications", async (_req, res) => {
    try {
      const publications = await loadPublications();

      res.json({ publications });
    } catch (error) {
      console.error('Error listing PDFs:', error);
      res.status(500).json({ message: 'Failed to list PDFs' });
    }
  });

  // Get PDF metadata
  app.get("/api/publications/:filename/metadata", async (req, res) => {
    try {
      const metadata = await getPdfMetadata(req.params.filename);
      if (!metadata) {
        return res.status(404).json({ message: 'PDF not found' });
      }
      res.json({ metadata });
    } catch (error) {
      console.error('Error getting metadata:', error);
      res.status(500).json({ message: 'Failed to get metadata' });
    }
  });

  // Delete PDF endpoint
  app.delete("/api/publications/:filename", async (req, res) => {
    try {
      const success = await deletePdf(req.params.filename);
      if (!success) {
        return res.status(404).json({ message: 'PDF not found or could not be deleted' });
      }
      res.json({ message: 'PDF deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Failed to delete PDF' });
    }
  });

  // Register PDF routes for publications
  app.use("/api/publications", pdfRoutes);
  
  // PayPal routes - paths must match the PayPalButton component
  app.get("/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req, res) => {
    res.status(410).json({ error: "Use the store's validated checkout to purchase products." });
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    res.status(410).json({ error: "Use the store's validated checkout to purchase products." });
  });
  
  // Endpoint to check PayPal availability
  app.get("/api/paypal/status", (_req, res) => {
    res.json({ available: isPayPalConfigured() });
  });

  const httpServer = createServer(app);

  return httpServer;
}