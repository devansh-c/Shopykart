import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Optimized ZIP script for ShopyKart Project.
 * Excludes heavy folders like node_modules to keep size under 25MB.
 */

async function zipFolder(dir, zip, rootDir) {
  const files = fs.readdirSync(dir);
  const exclude = ['node_modules', '.next', 'out', '.git', 'android', 'shopykart-project.zip', '.DS_Store'];

  for (const file of files) {
    if (exclude.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(rootDir, filePath);

    if (stat.isDirectory()) {
      await zipFolder(filePath, zip, rootDir);
    } else {
      const content = fs.readFileSync(filePath);
      zip.file(relativePath, content);
    }
  }
}

async function createZip() {
  console.log('🚀 Starting project compression...');
  const zip = new JSZip();
  const rootDir = process.cwd();

  try {
    await zipFolder(rootDir, zip, rootDir);
    const content = await zip.generateAsync({ 
      type: 'nodebuffer', 
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    fs.writeFileSync('shopykart-project.zip', content);
    console.log('✅ SUCCESS: shopykart-project.zip is now ready in the root directory.');
  } catch (err) {
    console.error('❌ ERROR during compression:', err);
  }
}

createZip();
