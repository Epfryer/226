
import { Client } from '@replit/object-storage';

const client = new Client();

export interface UploadResult {
  success: boolean;
  objectName?: string;
  url?: string;
  error?: string;
}

export async function uploadPdf(
  file: Buffer,
  filename: string,
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `publications/${sanitizedFilename}`;
    
    // Upload to Object Storage
    const result = await client.uploadFromBytes(objectName, file, {
      metadata: {
        contentType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    });

    if (!result.ok) {
      return {
        success: false,
        error: result.error.message
      };
    }

    return {
      success: true,
      objectName,
      url: `/api/publications/${sanitizedFilename}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function listPdfs(): Promise<string[]> {
  try {
    const objects = await client.list({ prefix: 'publications/' });
    return objects.map(obj => obj.name.replace('publications/', ''));
  } catch (error) {
    console.error('Error listing PDFs:', error);
    return [];
  }
}

export async function deletePdf(filename: string): Promise<boolean> {
  try {
    const objectName = `publications/${filename}`;
    const result = await client.delete(objectName);
    return result.ok;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}

export async function getPdfMetadata(filename: string) {
  try {
    const objectName = `publications/${filename}`;
    const result = await client.getMetadata(objectName);
    
    if (!result.ok) {
      return null;
    }
    
    return result.value;
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return null;
  }
}
