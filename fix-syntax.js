const fs = require('fs');

function fixSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix React imports
  content = content.replace(/import \{ useTranslation \} from "react-i18next"/g, 'import { useTranslation } from "@/hooks/use-translation"');
  
  // Fix placeholder=t(...) to placeholder={t(...)}
  content = content.replace(/placeholder=t\((.*?)\)/g, 'placeholder={t()}');
  
  // Fix title=t(...) to title={t(...)}
  content = content.replace(/title=t\((.*?)\)/g, 'title={t()}');

  fs.writeFileSync(filePath, content);
}

fixSyntax('./src/app/(main)/kho/components/phieu-giao-dich.tsx');
fixSyntax('./src/app/(main)/san-xuat/import/import-page-client.tsx');
fixSyntax('./src/app/(main)/kho/components/ban-thanh-pham.tsx');
fixSyntax('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx');
fixSyntax('./src/app/(main)/dashboard/dashboard-client.tsx');

console.log("Fixed syntax errors.");
