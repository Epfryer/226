import { existsSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist', 'public');
const required = [
  'publications/hybrid-urbanism.pdf',
  'publications/EthanFryer_5thYear_SelectedWorks.pdf',
  'pdfjs/web/viewer.html',
  'pdfjs/build/pdf.worker.min.mjs'
];

console.log('Verifying build output...\n');
let allGood = true;

for (const file of required) {
  const fullPath = join(distDir, file);
  const exists = existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
}

if (allGood) {
  console.log('\n✅ All required files are present in dist!');
  console.log('\nOn the published site, these URLs should return 200:');
  console.log('- [BASE]/publications/hybrid-urbanism.pdf');
  console.log('- [BASE]/publications/EthanFryer_5thYear_SelectedWorks.pdf');
  console.log('- [BASE]/pdfjs/web/viewer.html');
  console.log('- [BASE]/pdfjs/build/pdf.worker.min.mjs');
} else {
  console.log('\n❌ Some files are missing. Run "npm run prepare" and rebuild.');
  process.exit(1);
}