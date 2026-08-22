const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const langs = ['vi', 'en', 'zh'];

const newKeys = {
  warehouse: {
    importExport: { vi: 'Nhập / Xuất Kho', en: 'Import / Export', zh: '入库 / 出库' },
    importExportVoucher: { vi: 'Phiếu Nhập/Xuất', en: 'Import/Export Voucher', zh: '入库/出库凭证' }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesDir, lang + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.warehouse) data.warehouse = {};
  data.warehouse.importExport = newKeys.warehouse.importExport[lang];
  data.warehouse.importExportVoucher = newKeys.warehouse.importExportVoucher[lang];
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});

console.log("Updated JSON files");
