import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client } from '@replit/object-storage';
import multer from 'multer';
import { uploadPdf, listPdfs, deletePdf, getPdfMetadata } from './storage';
import pdfRoutes from './pdf-routes';

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
      const pdfs = await listPdfs();

      // Create publication objects with download URLs
      const publications = await Promise.all(
        pdfs.map(async (filename) => {
          const metadata = await getPdfMetadata(filename);
          return {
            slug: filename.replace('.pdf', '').replace(/[^a-zA-Z0-9-]/g, '-'),
            title: metadata?.title || filename.replace('.pdf', ''),
            year: metadata?.year || new Date().getFullYear().toString(),
            pdfPath: `/api/publications/${filename}`,
            filename: filename,
            metadata: metadata
          };
        })
      );

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

  const httpServer = createServer(app);

  return httpServer;
}