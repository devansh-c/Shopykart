import fs from 'fs';
import archiver from 'archiver';

/**
 * @fileOverview Specialized Bundle Script.
 * Packages the entire ShopyKart source for Android Studio consumption.
 */

const output = fs.createWriteStream('shopykart-source.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log('\n✅ Project successfully zipped! (Total: ' + (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB)');
  console.log('----------------------------------------------------');
  console.log('👉 KEYBOARD WORKFLOW TO DOWNLOAD:');
  console.log('1. Press Ctrl + Shift + E to focus Sidebar.');
  console.log('2. Arrow keys to select "shopykart-source.zip".');
  console.log('3. Press Shift + F10 (or Menu Key) for Options.');
  console.log('4. Select "Download" and press Enter.');
  console.log('----------------------------------------------------\n');
});

archive.on('error', function(err) { throw err; });
archive.pipe(output);

// Filter list to keep the ZIP small and clean
const ignore = [
  'node_modules',
  '.next',
  'out',
  'shopykart-source.zip',
  '.git',
  '.agents',
  '.firebase'
];

const items = fs.readdirSync('.');
items.forEach(item => {
  if (!ignore.includes(item)) {
    const stats = fs.statSync(item);
    if (stats.isDirectory()) {
      archive.directory(item + '/', item);
    } else {
      archive.file(item, { name: item });
    }
  }
});

archive.finalize();