import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

function addFilesToZip(dir, zipFolder) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    // Exclude heavy/unnecessary folders for GitHub readiness
    if ([
      'node_modules', 
      '.next', 
      'out', 
      '.git', 
      'android', 
      '.cache', 
      '.turbopack'
    ].includes(file)) continue;
    
    // Don't include the zip itself
    if (file === 'shopykart-project.zip') continue;

    if (stat.isDirectory()) {
      addFilesToZip(fullPath, zipFolder.folder(file));
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(file, content);
    }
  }
}

async function createZip() {
  console.log('🚀 Generating optimized project ZIP for GitHub...');
  
  try {
    addFilesToZip(process.cwd(), zip);

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    fs.writeFileSync('shopykart-project.zip', buffer);
    
    const size = (buffer.length / (1024 * 1024)).toFixed(2);
    console.log(`✅ Success! Project compressed to ${size} MB.`);
    console.log('--------------------------------------------');
    console.log('1. Look at the left sidebar (Explorer).');
    console.log('2. Find "shopykart-project.zip".');
    console.log('3. Right-click on it and select "Download".');
    console.log('--------------------------------------------');
  } catch (err) {
    console.error('❌ Compression failed:', err);
  }
}

createZip();
