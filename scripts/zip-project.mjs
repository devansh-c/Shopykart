/**
 * @fileOverview Project Packager for Mobile Users.
 * Bundles the entire project into a ZIP file for easy transport to a PC.
 */
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function packProject() {
  console.log("📦 Starting ShopyKart Packager...");
  const zip = new JSZip();
  const rootDir = process.cwd();

  const ignoreList = [
    'node_modules',
    '.next',
    'out',
    '.git',
    'shopykart-project.zip',
    '.DS_Store',
    'android/app/build',
    'android/.gradle'
  ];

  function addFolderToZip(folderPath, zipFolder) {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (ignoreList.includes(file)) continue;

      const fullPath = path.join(folderPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(file);
        addFolderToZip(fullPath, subFolder);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }

  try {
    addFolderToZip(rootDir, zip);
    
    console.log("⚡ Generating ZIP file (this may take a minute)...");
    const content = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    fs.writeFileSync('shopykart-project.zip', content);
    console.log("✅ SUCCESS: shopykart-project.zip created!");
    console.log("👉 Now download it from the sidebar and use it on your PC.");
  } catch (err) {
    console.error("❌ Packaging failed:", err);
  }
}

packProject();
