import type { Express } from "express";
import { createServer, type Server } from "http";
import { Client } from '@replit/object-storage';

export function registerRoutes(app: Express): Server {
  const client = new Client();

  // API route to serve PDF from Object Storage
  app.get("/api/publications/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const objectName = `publications/${filename}`;
      
      const pdfBuffer = await client.downloadAsBytes(objectName);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error fetching PDF:', error);
      res.status(404).json({ message: 'PDF not found' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}