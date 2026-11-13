import fs from 'fs';
import path from 'path';

function addJsExtension(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      addJsExtension(fullPath);
    } else if (entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Thêm .js vào các đường dẫn import/export tương đối (./ hoặc ../) chưa có đuôi .js/.json
      content = content.replace(
        /(from\s+['"]|import\s*\(\s*['"])(\.\.?\/[^'"]+?)(?<!\.js|\.json)(['"])/g,
        '$1$2.js$3'
      );
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

addJsExtension('./dist');
console.log('✔ Added .js extensions to ESM imports in dist/');
