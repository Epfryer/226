
import { uploadPdf } from '../server/storage';
import fs from 'fs';
import path from 'path';

async function uploadAllPdfs() {
  const publicationsDir = path.join(process.cwd(), 'client/public/publications');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(publicationsDir)) {
      console.error('❌ Publications directory not found:', publicationsDir);
      process.exit(1);
    }
    
    // Get all PDF files
    const files = fs.readdirSync(publicationsDir).filter(f => f.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('⚠️  No PDF files found in', publicationsDir);
      process.exit(0);
    }
    
    console.log(`📚 Found ${files.length} PDF(s) to upload...\n`);
    
    for (const filename of files) {
      const pdfPath = path.join(publicationsDir, filename);
      const fileBuffer = fs.readFileSync(pdfPath);
      const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
      
      console.log(`⏳ Uploading ${filename} (${fileSizeMB} MB)...`);
      
      // Extract metadata from filename
      const metadata: Record<string, string> = {
        uploadedAt: new Date().toISOString()
      };
      
      if (filename.includes('hybrid-urbanism')) {
        metadata.title = 'Hybrid Urbanism';
        metadata.year = '2025';
      } else if (filename.includes('5thYear')) {
        metadata.title = '5th Year Selected Works';
        metadata.year = '2024';
      }
      
      const result = await uploadPdf(fileBuffer, filename, metadata);
      
      if (result.success) {
        console.log(`✅ Successfully uploaded: ${filename}`);
        console.log(`   📦 Object name: ${result.objectName}`);
        console.log(`   🔗 URL: ${result.url}\n`);
      } else {
        console.error(`❌ Failed to upload ${filename}:`, result.error);
      }
    }
    
    console.log('🎉 Upload complete!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadAllPdfs();
