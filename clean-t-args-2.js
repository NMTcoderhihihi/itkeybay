const fs = require('fs');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/t\(\s*"([^"]+)"[^\)]*\)+/g, 't("")');
  fs.writeFileSync(filePath, content);
}

cleanFile('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx');
cleanFile('./src/app/(main)/kho/components/ban-thanh-pham.tsx');
console.log("Cleaned up t() in other files");
