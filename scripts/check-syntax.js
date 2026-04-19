const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filesToCheck = [
  'src/server.js',
  'src/routes/places.routes.js',
  'src/routes/auth.routes.js',
  'src/routes/admin.routes.js',
  'src/routes/favorites.routes.js',
  'src/routes/reviews.routes.js',
  'src/utils/admin.js',
  'src/utils/auth.js',
  'src/utils/places-json-sync.js',
  'src/utils/session.js',
  'src/utils/mail.js',
  'src/config/db.js',
  'database/init.js',
  'database/validate-places.js',
  'public/js/auth.js',
  'public/js/admin.js',
  'public/js/app.js',
  'public/js/map-controller.js',
  'public/js/places-controller.js',
  'public/js/route-controller.js'
];

let hasErrors = false;

filesToCheck.forEach((relativePath) => {
  const filePath = path.join(process.cwd(), relativePath);

  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const normalizedSource = normalizeModuleSyntax(source);
    new vm.Script(normalizedSource, { filename: relativePath });
    console.log(`[syntax:ok] ${relativePath}`);
  } catch (error) {
    hasErrors = true;
    console.error(`[syntax:error] ${relativePath}`);
    console.error(error.message);
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log(`[syntax:ok] validated ${filesToCheck.length} files`);

function normalizeModuleSyntax(source) {
  return source
    .replace(/^\s*import\s+.+?;?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(?=(async\s+function|function|const|let|var|class))/gm, '');
}
