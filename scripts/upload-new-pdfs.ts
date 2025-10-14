
import { uploadPdf } from '../server/storage';
import fs from 'fs';
import path from 'path';

async function uploadNewPdfs() {
  const publicationsDir = path.join(process.cwd(), 'client/public/publications');
  
  // The three new PDFs to upload
  const newPdfs = [
    'EthanFryer_European_Travel_Research_Paper .pdf',
    'EthanFryer_Natures_Transcendence_ICR.pdf',
    'EthanFryer_WorkSample_2024.pdf'
  ];
  
  console.log(`📚 Uploading ${newPdfs.length} new PDFs...\n`);
  
  for (const filename of newPdfs) {
    const pdfPath = path.join(publicationsDir, filename);
    
    if (!fs.existsSync(pdfPath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }
    
    const fileBuffer = fs.readFileSync(pdfPath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    
    console.log(`⏳ Uploading ${filename} (${fileSizeMB} MB)...`);
    
    // Extract metadata from filename
    const metadata: Record<string, string> = {
      uploadedAt: new Date().toISOString()
    };
    
    if (filename.includes('European_Travel')) {
      metadata.title = 'European Travel Research Paper';
      metadata.year = '2024';
    } else if (filename.includes('Natures_Transcendence')) {
      metadata.title = "Nature's Transcendence ICR";
      metadata.year = '2024';
    } else if (filename.includes('WorkSample')) {
      metadata.title = 'Work Sample 2024';
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
}

uploadNewPdfs();
