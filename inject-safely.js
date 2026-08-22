const fs = require('fs');

function injectSafely(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import { useTranslation }')) {
    content = 'import { useTranslation } from "@/hooks/use-translation"\n' + content;
  }
  
  // Inject const { t } = useTranslation(); after export function ... {
  // Use a safer regex
  content = content.replace(/(export function [^{]+\{)/, '\n  const { t } = useTranslation();');
  fs.writeFileSync(filePath, content);
}

injectSafely('./src/app/(main)/kho/components/ban-thanh-pham.tsx');
injectSafely('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx');
console.log("Injected safely");
