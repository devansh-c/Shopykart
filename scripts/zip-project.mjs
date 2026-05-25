import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Optimized ZIP generator for ShopyKart.
 * Excludes heavy folders to keep file size under 25MB for GitHub.
 */

const zip = new JSZip();
const outputFileName = 'shopykart-project.zip';
const excludedDirs = ['node_modules', '.next', 'out', '.git', 'android', '.firebase', '.github'];
const excludedFiles = [outputFileName, '.DS_Store', 'package-lock.json'];

async function addFilesToZip(dir, zipFolder) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (excludedDirs.includes(file)) continue;
      const folder = zipFolder.folder(file);
      await addFilesToZip(fullPath, folder);
    } else {
      if (excludedFiles.includes(file)) continue;
      const content = fs.readFileSync(fullPath);
      zipFolder.file(file, content);
    }
  }
}

async function run() {
  console.log('🚀 Starting ShopyKart Optimization & Compression...');
  try {
    await addFilesToZip(process.cwd(), zip);
    
    console.log('📦 Bundling files into ZIP...');
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    fs.writeFileSync(outputFileName, buffer);
    console.log(`✅ SUCCESS: ${outputFileName} created successfully!`);
    console.log('👉 Please check the left Sidebar (Files), Right-click on it, and select "Download".');
  } catch (error) {
    console.error('❌ Compression Failed:', error);
  }
}

run();