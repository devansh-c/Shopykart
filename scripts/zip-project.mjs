
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { execSync } from 'child_process';

const zip = new JSZip();
const rootDir = process.cwd();
const outputName = 'shopykart-source.zip';

// Files and folders to exclude from the bundle
const excludeList = [
  'node_modules',
  '.next',
  'out',
  '.git',
  '.DS_Store',
  'shopykart-source.zip',
  'package-lock.json'
];

function addFilesToZip(currentDir, zipFolder) {
  const files = fs.readdirSync(currentDir);

  for (const file of files) {
    if (excludeList.includes(file)) continue;

    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const newZipFolder = zipFolder.folder(file);
      addFilesToZip(fullPath, newZipFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(file, content);
    }
  }
}

console.log('🚀 Bundling ShopyKart source code...');

try {
  addFilesToZip(rootDir, zip);

  zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream(outputName))
    .on('finish', function () {
      console.log(`✅ Project successfully zipped: ${outputName}`);
      console.log('👉 Right-click the file in the sidebar and select "Download"');
    });
} catch (error) {
  console.error('❌ Error creating zip:', error);
}
