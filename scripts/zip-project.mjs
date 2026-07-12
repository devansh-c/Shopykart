import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Script to zip the project source code for portability.
 * Excludes large folders like node_modules and .next
 */
async function zipProject() {
  const output = fs.createWriteStream(path.join(process.cwd(), 'shopykart_source_code.zip'));
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  output.on('close', () => {
    console.log(`✅ Project zipped successfully! Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log('You can now download this zip file from the project explorer.');
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add files and directories
  const items = fs.readdirSync(process.cwd());
  const excluded = ['node_modules', '.next', '.git', 'out', 'shopykart_source_code.zip', 'android/app/build', 'android/.gradle'];

  for (const item of items) {
    if (excluded.includes(item)) continue;
    
    const stats = fs.statSync(item);
    if (stats.isDirectory()) {
      archive.directory(item, item);
    } else {
      archive.file(item, { name: item });
    }
  }

  await archive.finalize();
}

zipProject().catch(console.error);