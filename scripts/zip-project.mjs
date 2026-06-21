
import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const output = fs.createWriteStream(path.join(publicDir, 'shopykart-source.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log('--------------------------------------------------');
  console.log('✅ Project successfully zipped!');
  console.log('📦 Total size: ' + (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB');
  console.log('📥 Location: public/shopykart-source.zip');
  console.log('--------------------------------------------------');
  console.log('INSTRUCTIONS:');
  console.log('1. Look at the left Sidebar (File Explorer).');
  console.log('2. Right-click "shopykart-source.zip" inside the "public" folder.');
  console.log('3. Select "Download".');
  console.log('--------------------------------------------------');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Append files from root, excluding heavy/unnecessary folders
archive.glob('**/*', {
  cwd: rootDir,
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'public/shopykart-source.zip',
    '.git/**',
    '.zip'
  ]
});

archive.finalize();
