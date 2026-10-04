const fs = require('fs');
let code = fs.readFileSync('src/app/(main)/kho/page.tsx', 'utf8');

code = code.replace(/import \{ getDanhSachDonTong \} from "@\/app\/actions\/don-tong"[\r\n]*/, '');
code = code.replace(/, getDanhSachDonTong\(\)/, '');
code = code.replace(/,\s*donTongList/, '');
code = code.replace(/donTongList=\{donTongList \|\| \[\]\}/, '');

fs.writeFileSync('src/app/(main)/kho/page.tsx', code);
