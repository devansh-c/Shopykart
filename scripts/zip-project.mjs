
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

async function zipProject() {
  const output = fs.createWriteStream('shopykart-project.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('close', function() {
    console.log('✅ Success! Project has been zipped to: shopykart-project.zip');
    console.log('Total bytes: ' + archive.pointer());
    console.log('Ab aap sidebar se is file ko download karke apne laptop par le ja sakte hain.');
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // Add files and directories
  archive.glob('**/*', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'out/**',
      '.git/**',
      'shopykart-project.zip',
      'android/.gradle/**',
      'android/app/build/**',
      'android/.idea/**'
    ]
  });

  await archive.finalize();
}

console.log('📦 Zipping project for laptop migration...');
zipProject().catch(err => {
  console.error('❌ Zipping failed:', err);
});
