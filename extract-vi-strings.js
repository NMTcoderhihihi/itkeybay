const fs = require("fs");
const path = require("path");

const files = [
  "./src/app/(main)/dashboard/dashboard-client.tsx",
  "./src/app/(main)/kho/components/tong-quan-kho.tsx",
  "./src/app/(main)/kho/components/phieu-giao-dich.tsx",
  "./src/app/(main)/kho/components/ban-thanh-pham.tsx",
  "./src/app/(main)/kho/components/kho-client.tsx",
  "./src/app/(main)/san-xuat/import/import-page-client.tsx",
  "./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx"
];

const viRegex = /[a-zA-Z]*[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ][a-zA-ZàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ\s]*/gu;

files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      // ignore comments and console.logs and t("...")
      if (line.trim().startsWith("//") || line.includes("console.") || line.includes("t(")) return;
      const matches = line.match(viRegex);
      if (matches) {
        // filter out short fragments
        const valid = matches.filter(m => m.trim().length > 2 && m.trim() !== "vnd");
        if (valid.length > 0) {
          console.log(`${f}:${i+1} -> ${line.trim()}`);
        }
      }
    });
  }
});
