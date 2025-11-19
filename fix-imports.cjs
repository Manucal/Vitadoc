const fs = require('fs');
const path = require('path');

const folders = ['src/routes', 'src/middleware', 'src/config', 'src/models', 'src/controllers'];

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⏭️  Carpeta no encontrada: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let updated = content;

      // Reemplazar imports sin .js
      updated = updated.replace(
        /from\s+['"](\.\.[/\\]|\.\/|\.\\)([^'"]+?)(\.js)?['"]/g,
        (match, prefix, path, ext) => {
          if (!path.endsWith('.json') && !ext) {
            return `from '${prefix}${path}.js'`;
          }
          return match;
        }
      );

      updated = updated.replace(
        /import\s+['"](\.\.[/\\]|\.\/|\.\\)([^'"]+?)(\.js)?['"]/g,
        (match, prefix, path, ext) => {
          if (!path.endsWith('.json') && !ext) {
            return `import '${prefix}${path}.js'`;
          }
          return match;
        }
      );

      if (updated !== content) {
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`✅ Updated: ${filePath}`);
      }
    }
  });
}

folders.forEach(folder => walkDir(folder));
console.log('\n✅ Done! All imports updated.');
