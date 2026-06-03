
import fs from 'fs';
import path from 'path';
import archiver from 'jszip'; // Using jszip as it's already in package.json
import { fileURLToPath } from 'url';

/**
 * @fileOverview Script to bundle the entire project into a ZIP file.
 * Excludes heavy folders like node_modules and .next.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const zipName = 'shopykart-project.zip';

async function zipDirectory(sourceDir, outPath) {
  const zip = new archiver();

  const excludeDirs = ['node_modules', '.next', 'out', '.git', '.firebase'];
  const excludeFiles = [zipName, '.DS_Store', 'package-lock.json'];

  function addFilesToZip(dir, zipFolder) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          addFilesToZip(filePath, zipFolder.folder(file));
        }
      } else {
        if (!excludeFiles.includes(file)) {
          const content = fs.readFileSync(filePath);
          zipFolder.file(file, content);
        }
      }
    }
  }

  console.log('📦 Starting compression...');
  addFilesToZip(sourceDir, zip);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(outPath, content);
  console.log(`✅ Success! Project bundled to: ${outPath}`);
}

zipDirectory(rootDir, path.join(rootDir, zipName)).catch(err => {
  console.error('❌ Zip Failed:', err);
});
