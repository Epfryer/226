
import { Client } from '@replit/object-storage';

async function listPdfs() {
  const client = new Client();
  
  try {
    console.log('Listing all objects in Object Storage...');
    const result = await client.list();
    
    if (!result.ok) {
      console.error('Failed to list objects:', result.error);
      return;
    }
    
    const objects = result.value || [];
    
    console.log(`\nFound ${objects.length} objects:`);
    objects.forEach(obj => {
      console.log(`- ${obj.name}`);
    });
    
    if (objects.length === 0) {
      console.log('\n⚠️  No PDFs found in Object Storage!');
      console.log('You need to upload your PDFs first using: npm run upload-pdf');
    }
  } catch (error) {
    console.error('Error listing PDFs:', error);
  }
}

listPdfs();
