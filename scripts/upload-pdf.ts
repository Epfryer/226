
import { uploadPdf } from '../server/storage';
import fs from 'fs';
import path from 'path';

async function uploadPdfFile() {
  const pdfPath = path.join(process.cwd(), 'client/public/publications/hybrid-urbanism.pdf');
  
  try {
    // Read the PDF file
    const fileBuffer = fs.readFileSync(pdfPath);
    
    // Upload using the storage utility
    const result = await uploadPdf(fileBuffer, 'hybrid-urbanism.pdf', {
      title: 'Hybrid Urbanism',
      year: '2024',
      author: 'Ethan Fryer'
    });
    
    if (result.success) {
      console.log('✅ Successfully uploaded PDF to Object Storage');
      console.log(`📦 Object name: ${result.objectName}`);
      console.log(`🔗 URL: ${result.url}`);
    } else {
      console.error('❌ Upload failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadPdfFile();
