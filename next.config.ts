/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
};

// Only run this code during build time, not in browser
if (typeof window === 'undefined') {
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
    
    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} to public folder`);
      } catch (err) {
        console.error(`Error copying ${file}:`, err);
      }
    }
  });
}

module.exports = nextConfig;