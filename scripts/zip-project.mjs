
import fs from 'fs';
import archiver from 'archiver';
import path from 'path';

// Target the public folder so it's accessible, but also root for sidebar
const outputPath = path.join(process.cwd(), 'shopykart-source.zip');
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } 
});

output.on('close', function() {
  console.log('\n✅ PROJECT SUCCESSFULLY ZIPPED!');
  console.log('-----------------------------------');
  console.log('Location: ' + outputPath);
  console.log('Size: ' + (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB');
  console.log('\nKEYBOARD INSTRUCTIONS:');
  console.log('1. Press Ctrl + Shift + E to focus Sidebar.');
  console.log('2. Select "shopykart-source.zip".');
  console.log('3. Press Shift + F10 and select "Download".\n');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Bundle all essential files, excluding heavy cache/deps
archive.glob('**/*', {
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    '.git/**',
    'shopykart-source.zip',
    'shopykart-project.zip'
  ]
});

archive.finalize();
