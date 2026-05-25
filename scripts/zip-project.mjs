
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();
const outputFileName = 'shopykart-project.zip';
const excludeFolders = ['node_modules', '.next', 'out', 'android', '.git', '.capacitor', 'build'];
const excludeFiles = [outputFileName, '.DS_Store', 'node_modules.zip'];

function addFilesToZip(dirPath, zipFolder) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      if (excludeFolders.includes(file)) continue;
      const newZipFolder = zipFolder.folder(file);
      addFilesToZip(fullPath, newZipFolder);
    } else {
      if (excludeFiles.includes(file)) continue;
      zipFolder.file(file, fs.readFileSync(fullPath));
    }
  }
}

console.log("🚀 Starting ZIP generation...");

try {
  addFilesToZip('.', zip);
  
  zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream(outputFileName))
    .on('finish', () => {
      console.log('✅ SUCCESS: ' + outputFileName + ' has been created in the root directory!');
      console.log('👉 Now look at the file explorer on the left, right-click the file and select Download.');
    });
} catch (error) {
  console.error("❌ ZIP Error:", error);
}
