// copy-leaflet-assets.js
const fs = require('fs');
const path = require('path');

// Define paths
const leafletPath = path.join(__dirname, 'node_modules', 'leaflet', 'dist', 'images');
const publicPath = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Copy marker files
const markerFiles = ['marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png'];
markerFiles.forEach(file => {
  const sourcePath = path.join(leafletPath, file);
  const targetPath = path.join(publicPath, file);
  
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${file} to public folder`);
});