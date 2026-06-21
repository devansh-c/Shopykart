import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

/**
 * @fileOverview Specialized script to bundle the ShopyKart project into a ZIP.
 * Optimized for development environments where manual download is required.
 */

const output = fs.createWriteStream('shopykart-source.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', function() {
  console.log('\n-------------------------------------------');
  console.log('✅ Project successfully zipped!');
  console.log('📦 Total size: ' + (archive.pointer() / 1024 / 1024).toFixed(2) + ' MB');
  console.log('📍 File: shopykart-source.zip');
  console.log('-------------------------------------------\n');
  console.log('👉 NOW: Go to the LEFT SIDEBAR, find shopykart-source.zip,');
  console.log('👉 RIGHT-CLICK it and select DOWNLOAD.');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from the project root, ignoring unnecessary directories
archive.glob('**/*', {
  ignore: [
    'node_modules/**',
    '.next/**',
    'out/**',
    '.git/**',
    'shopykart-source.zip',
    '.firebase/**',
    '.npm/**',
    'capacitor/android/.gradle/**',
    'capacitor/android/app/build/**'
  ]
});

// Finalize the archive
archive.finalize();
