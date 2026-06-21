
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * @fileOverview Script to package the ShopyKart source code for local Android Studio builds.
 * Run via: npm run zip-project
 */

const ZIP_NAME = 'shopykart-source.zip';

console.log('🚀 Preparing ShopyKart Source for APK Build...');

try {
  // 1. Remove old zip if exists
  if (fs.existsSync(ZIP_NAME)) {
    fs.unlinkSync(ZIP_NAME);
  }

  // 2. We use the 'zip' command available in the environment
  // We exclude heavy folders that aren't needed for the build
  console.log('📦 Compressing files (excluding node_modules and .next)...');
  
  execSync(`zip -r ${ZIP_NAME} . -x "node_modules/*" ".next/*" ".git/*" "out/*" "dist/*"`);

  console.log('✅ SUCCESS!');
  console.log('---------------------------------------------------------');
  console.log(`File generated: ${ZIP_NAME}`);
  console.log('1. Look at the file list on the left sidebar.');
  console.log(`2. Right-click '${ZIP_NAME}' and select Download.`);
  console.log('3. Open this code on your PC in Android Studio to build APK.');
  console.log('---------------------------------------------------------');

} catch (error) {
  console.error('❌ Failed to create zip:', error.message);
  process.exit(1);
}
