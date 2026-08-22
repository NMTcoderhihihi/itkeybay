const fs = require('fs');
const filePath = './src/app/(main)/kho/components/phieu-giao-dich.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The regex will look for t( followed by any number of t("...", ... and reduce them
content = content.replace(/t\(\s*"([^"]+)"[^\)]*\)+/g, 't("")');

fs.writeFileSync(filePath, content);
console.log("Cleaned up t() in phieu-giao-dich.tsx");
