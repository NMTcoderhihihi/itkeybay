const fs = require('fs');

const files = [
  './src/app/(main)/kho/components/phieu-giao-dich.tsx',
  './src/app/(main)/kho/components/ban-thanh-pham.tsx',
  './src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  // replace t("key", "default value") with t("key")
  content = content.replace(/t\(\"([^\"]+)\",\s*\"([^\"]+)\"\)/g, 't("")');
  fs.writeFileSync(filePath, content);
});

console.log("Fixed t() arguments.");
