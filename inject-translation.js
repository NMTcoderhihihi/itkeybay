const fs = require('fs');

function addTranslation(filePath, functionName) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = 'import { useTranslation } from "@/hooks/use-translation"\n' + content;
  content = content.replace(new RegExp('(export function ' + functionName + '\\s*\\([^)]*\\)\\s*\\{)'), '\n  const { t } = useTranslation();');
  fs.writeFileSync(filePath, content);
}

addTranslation('./src/app/(main)/kho/components/ban-thanh-pham.tsx', 'BanThanhPhamList');
addTranslation('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx', 'CongHangDetailView');

console.log("Injected useTranslation correctly.");
