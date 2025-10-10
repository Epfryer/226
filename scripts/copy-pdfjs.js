
import { cpSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const publicPdfjsDir = join(projectRoot, 'client', 'public', 'pdfjs');
const pdfjsDistPath = join(projectRoot, 'node_modules', 'pdfjs-dist');

// Create public/pdfjs directory if it doesn't exist
if (!existsSync(publicPdfjsDir)) {
  mkdirSync(publicPdfjsDir, { recursive: true });
}

// Copy web viewer files
const webSourcePath = join(pdfjsDistPath, 'web');
if (existsSync(webSourcePath)) {
  cpSync(webSourcePath, publicPdfjsDir, { recursive: true });
  console.log('✓ Copied PDF.js web viewer');
}

// Create build directory and copy worker
const buildDir = join(publicPdfjsDir, 'build');
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

const workerSourcePath = join(pdfjsDistPath, 'build', 'pdf.worker.min.js');
const workerDestPath = join(buildDir, 'pdf.worker.min.js');
if (existsSync(workerSourcePath)) {
  cpSync(workerSourcePath, workerDestPath);
  console.log('✓ Copied PDF.js worker');
}

console.log('PDF.js setup complete!');
