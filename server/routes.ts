import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { assets } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get all assets
  app.get('/api/assets', async (req, res) => {
    try {
      const allAssets = await db.query.assets.findMany();
      res.json(allAssets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  });

  // Sync asset names
  app.post('/api/assets/sync', async (req, res) => {
    try {
      const { originalName, newName, projectId } = req.body;

      // Find existing asset
      const existingAsset = await db.query.assets.findFirst({
        where: eq(assets.originalName, originalName)
      });

      if (!existingAsset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      // Update asset name
      await db.update(assets)
        .set({ 
          originalName: newName,
          updatedAt: new Date()
        })
        .where(eq(assets.id, existingAsset.id));

      res.json({ message: 'Asset synchronized successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync asset' });
    }
  });

  // Create new asset
  app.post('/api/assets', async (req, res) => {
    try {
      const { originalName, placeholderPath, category, projectId } = req.body;

      const newAsset = await db.insert(assets)
        .values({
          originalName,
          placeholderPath,
          category,
          projectId,
        })
        .returning();

      res.json(newAsset[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create asset' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}