const fs = require('fs');
const path = require('path');

// Bridge that simulates exporting to Google Docs by writing a markdown file in a docs-ready folder
const ROOT = "D:\\Codex Folder\\digital-pr-agents";
function exportToGoogleDoc(campaign, sourcePath) {
  // Read source content
  let content = '';
  try {
    content = fs.readFileSync(sourcePath, 'utf8');
  } catch {
    content = '';
  }
  const destDir = path.join(campaign.path, 'docs', 'google-docs');
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, (campaign.id || 'export') + '.md');
  fs.writeFileSync(dest, content);
  return dest;
}

module.exports = { exportToGoogleDoc };
