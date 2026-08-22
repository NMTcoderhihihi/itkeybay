const fs = require('fs');

function fixImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import { useTranslation }')) {
    content = 'import { useTranslation } from "@/hooks/use-translation"\n' + content;
  }
  fs.writeFileSync(filePath, content);
}

fixImport('./src/app/(main)/kho/components/ban-thanh-pham.tsx');
fixImport('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx');

console.log("Fixed missing imports.");
