
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * specialized script to bundle the project source code for mobile deployment.
 * Excludes node_modules, .next, and large temporary folders.
 */
async function zipProject() {
  console.log('🚀 Bundling ShopyKart Source Code...');
  
  const outputName = 'shopykart-source.zip';
  
  // Clean up existing zip if any
  if (fs.existsSync(outputName)) {
    fs.unlinkSync(outputName);
  }

  try {
    // We use standard shell command 'zip' which is available in most linux environments
    // Excluding irrelevant folders to keep it small
    const cmd = `zip -r ${outputName} . -x "node_modules/*" ".next/*" "out/*" ".git/*" ".agents/*" "shopykart-source.zip"`;
    
    execSync(cmd, { stdio: 'inherit' });
    
    console.log(`\n✅ Project successfully zipped: ${outputName}`);
    console.log(`📍 HOW TO DOWNLOAD: Right-click '${outputName}' in the left sidebar and select 'Download'.`);
  } catch (err) {
    console.error('❌ Failed to zip project. Ensure "zip" utility is installed in the terminal environment.');
    console.error(err.message);
  }
}

zipProject();
