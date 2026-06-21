
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Custom script to zip the project and place it in the public folder.
 * This allows the user to download it via a direct link in the browser.
 */
async function zipProject() {
  const outputDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const outputPath = path.join(outputDir, 'shopykart-source.zip');
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`✅ Project successfully zipped: ${archive.pointer()} total bytes`);
    console.log(`📂 Location: public/shopykart-source.zip`);
    console.log(`🚀 You can now click the Download button in Admin Panel!`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add files but ignore bulky/unnecessary ones
  archive.glob('**/*', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/shopykart-source.zip',
      '.git/**',
      '*.zip'
    ]
  });

  await archive.finalize();
}

zipProject().catch(console.error);
