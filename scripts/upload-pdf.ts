
import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

async function uploadPdf() {
  const client = new Client();
  
  const pdfPath = path.join(process.cwd(), 'client/public/publications/hybrid-urbanism.pdf');
  const objectName = 'publications/hybrid-urbanism.pdf';
  
  try {
    // Read the PDF file
    const fileBuffer = fs.readFileSync(pdfPath);
    
    // Upload to Object Storage
    await client.uploadFromBytes(objectName, fileBuffer);
    
    console.log(`✅ Successfully uploaded ${objectName} to Object Storage`);
    console.log(`📦 Object name: ${objectName}`);
    
    // List objects to verify
    const objects = await client.list();
    console.log('\n📋 All objects in bucket:');
    objects.forEach(obj => console.log(`  - ${obj.name}`));
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadPdf();
