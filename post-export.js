/**
 * post-export.js
 * Copies dist/index.html → dist/404.html after Expo Web export.
 * This is the industry-standard SPA fallback for static hosts:
 * when the server can't find a matching file, it serves 404.html,
 * which contains the full SPA — letting the client router take over.
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
const src = path.join(dist, 'index.html');
const dst = path.join(dist, '404.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dst);
  console.log('✅ Copied index.html → 404.html (SPA fallback)');
} else {
  console.error('❌ dist/index.html not found — skipping 404.html copy');
  process.exit(1);
}
