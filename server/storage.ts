
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
    const objectName = sanitizedFilename;
    
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
    const result = await client.list();
    
    console.log('Object Storage list result:', result);
    
    if (!result.ok) {
      console.error('Failed to list objects:', result.error);
      return [];
    }
    
    const objects = result.value || [];
    
    console.log(`Found ${objects.length} objects in Object Storage`);
    
    if (objects.length === 0) {
      console.log('No objects found in bucket');
      return [];
    }
    
    return objects.map(obj => obj.name);
  } catch (error) {
    console.error('Error listing PDFs:', error);
    return [];
  }
}

export async function deletePdf(filename: string): Promise<boolean> {
  try {
    const objectName = filename;
    const result = await client.delete(objectName);
    return result.ok;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
}

export async function getPdfMetadata(filename: string) {
  // Metadata is stored during upload but cannot be retrieved
  // Return basic metadata based on filename
  const metadata: Record<string, string> = {
    originalName: filename
  };
  
  if (filename.includes('hybrid-urbanism')) {
    metadata.title = 'Hybrid Urbanism';
    metadata.year = '2025';
  } else if (filename.includes('5thYear')) {
    metadata.title = '5th Year Selected Works';
    metadata.year = '2024';
  } else {
    // Default metadata
    metadata.title = filename.replace('.pdf', '').replace(/[_-]/g, ' ');
    metadata.year = new Date().getFullYear().toString();
  }
  
  return metadata;
}
