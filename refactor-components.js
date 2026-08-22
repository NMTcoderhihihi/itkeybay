const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  // inject useTranslation if not present
  if (!content.includes('useTranslation')) {
    content = content.replace('import { useState }', 'import { useState }\nimport { useTranslation } from "react-i18next"');
  }
  // inject const { t } = useTranslation() inside the component
  if (!content.includes('const { t } = useTranslation()')) {
    content = content.replace(/(export function [a-zA-Z0-9_]+\s*\([^)]*\)\s*\{)/, '\n  const { t } = useTranslation();');
  }

  for (const [oldStr, newStr] of replacements) {
    // Escape regex special chars in oldStr
    const escapeRegex = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapeRegex(oldStr), 'g');
    content = content.replace(regex, newStr);
  }
  fs.writeFileSync(filePath, content);
}

// 1. phieu-giao-dich.tsx
replaceInFile('./src/app/(main)/kho/components/phieu-giao-dich.tsx', [
  ['"Lý do (Danh mục)"', 't("warehouse.reasonCategory", "Lý do (Danh mục)")'],
  ['"Chọn lý do..."', 't("warehouse.selectReason", "Chọn lý do...")'],
  ['"Cấp cho Công Hàng (Tùy chọn)"', 't("warehouse.issueToOrder", "Cấp cho Công Hàng (Tùy chọn)")'],
  ['"Không áp dụng"', 't("warehouse.notApplied", "Không áp dụng")'],
  ['"Tạo phiếu giao dịch thành công!"', 't("warehouse.createTxSuccess", "Tạo phiếu giao dịch thành công!")'],
  ['"Lưu Phiếu Giao Dịch"', 't("warehouse.saveTx", "Lưu Phiếu Giao Dịch")'],
  ['"Đang lưu..."', 't("dashboard.saving", "Đang lưu...")']
]);

// 2. ban-thanh-pham.tsx
replaceInFile('./src/app/(main)/kho/components/ban-thanh-pham.tsx', [
  ['"Tổng Bán thành phẩm"', 't("dashboard.semiProduct")'],
  ['"Chi tiết Bán Thành Phẩm"', 't("warehouse.semiProductDetails", "Chi tiết Bán Thành Phẩm")'],
  ['"Tồn kho (Cái)"', 't("warehouse.stockPieces", "Tồn kho (Cái)")'],
  ['"Mã công hàng"', 't("production.importCodeCol", "Mã công hàng")'],
  ['"Mã đơn hàng"', 't("production.orderCodePlaceholder", "Mã đơn hàng")']
]);

// 3. cong-hang-detail-view.tsx
replaceInFile('./src/app/(main)/san-xuat/components/cong-hang-detail-view.tsx', [
  ['"Bắt đầu Sản xuất"', 't("production.startProduction", "Bắt đầu Sản xuất")'],
  ['"Cấp / Phát Liệu"', 't("production.issueMaterial", "Cấp / Phát Liệu")'],
  ['"Chốt Hoàn Thành"', 't("production.markCompleted", "Chốt Hoàn Thành")'],
  ['"Xuất BTP"', 't("production.exportSemiProduct", "Xuất BTP")'],
  ['"Đã hoàn thành"', 't("dashboard.completed", "Đã hoàn thành")'],
  ['"Đã giao hàng"', 't("production.delivered", "Đã giao hàng")'],
  ['"Tiến độ Tổng quan"', 't("production.overallProgress", "Tiến độ Tổng quan")'],
  ['"Chi tiết Đơn Hàng"', 't("production.orderDetails", "Chi tiết Đơn Hàng")'],
  ['"+ Thêm"', 't("production.add", "+ Thêm")'],
  ['"Ghi chú"', 't("production.notes", "Ghi chú")'],
  ['"Không có ghi chú"', 't("production.noNotes", "Không có ghi chú")'],
  ['"Phân công & Tiến độ chi tiết"', 't("production.stageAssignment", "Phân công & Tiến độ chi tiết")'],
  ['"Đã xong"', 't("production.stageDone", "Đã xong")'],
  ['"Xác nhận xong"', 't("production.confirmDone", "Xác nhận xong")'],
  ['"Đang chờ..."', 't("production.waiting", "Đang chờ...")'],
  ['"Lịch sử Cấp / Phát Liệu (Kho)"', 't("production.materialHistory", "Lịch sử Cấp / Phát Liệu (Kho)")'],
  ['"Chưa có lịch sử giao dịch"', 't("production.noHistory", "Chưa có lịch sử giao dịch")'],
  ['"Hoàn thành Công hàng"', 't("production.completeOrderTitle", "Hoàn thành Công hàng")'],
  ['"Xuất Kho (Giao hàng)"', 't("production.exportWarehouse", "Xuất Kho (Giao hàng)")'],
  ['"Xác nhận Giao"', 't("production.confirmDelivery", "Xác nhận Giao")'],
  ['"Xác nhận"', 't("production.confirm", "Xác nhận")']
]);

console.log("Done refactoring with node script.");
