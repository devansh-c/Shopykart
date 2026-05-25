
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();
const outputFile = 'shopykart-project.zip';

// Folders and files to exclude from the ZIP
const ignoreList = [
  'node_modules',
  '.next',
  'out',
  '.git',
  'android',
  '.env',
  '.DS_Store',
  outputFile
];

function addFilesToZip(dir, zipFolder) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (ignoreList.includes(file)) continue;

    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const subFolder = zipFolder.folder(file);
      addFilesToZip(filePath, subFolder);
    } else {
      const content = fs.readFileSync(filePath);
      zipFolder.file(file, content);
    }
  }
}

async function generateZip() {
  console.log('🚀 Generating optimized project ZIP for GitHub...');
  
  try {
    addFilesToZip(process.cwd(), zip);
    
    const content = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    fs.writeFileSync(outputFile, content);
    const size = (content.length / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Success! Project compressed to ${size} MB.`);
    console.log('\n1. Look at the left sidebar (Explorer).');
    console.log(`2. Find "${outputFile}".`);
    console.log('3. Right-click (or Long-press) on it and select "Download".\n');
  } catch (err) {
    console.error('❌ Error creating ZIP:', err);
  }
}

generateZip();
