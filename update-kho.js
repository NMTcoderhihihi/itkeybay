const fs = require('fs');
let code = fs.readFileSync('src/app/(main)/kho/components/kho-client.tsx', 'utf8');

// Remove import
code = code.replace(/import \{ DonTongTab \} from "\.\/don-tong-tab"[\r\n]*/, '');

// Remove Tab Trigger
code = code.replace(/<TabsTrigger[^>]*value="don-tong"[^>]*>[\s\S]*?<\/TabsTrigger>/, '');

// Remove Tab Content
code = code.replace(/<TabsContent value="don-tong" className="m-0 h-full">[\s\S]*?<\/TabsContent>/, '');

fs.writeFileSync('src/app/(main)/kho/components/kho-client.tsx', code);
