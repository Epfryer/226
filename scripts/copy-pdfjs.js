
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

// Copy all build files (worker, etc)
const buildSourcePath = join(pdfjsDistPath, 'build');
const buildDestPath = join(publicPdfjsDir, 'build');
if (existsSync(buildSourcePath)) {
  cpSync(buildSourcePath, buildDestPath, { recursive: true });
  console.log('✓ Copied PDF.js build files (worker)');
}

console.log('PDF.js setup complete!');
