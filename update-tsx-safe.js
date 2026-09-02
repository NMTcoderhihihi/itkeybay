const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasTranslationImport = content.includes('useTranslation');
  
  if (!hasTranslationImport) {
    content = 'import { useTranslation } from "@/hooks/use-translation"\n' + content;
  }
  
  if (!content.includes('const { t } = useTranslation()')) {
    content = content.replace(/export function (\w+)\s*\([^)]*\)\s*\{/, (match) => {
      return match + '\n  const { t } = useTranslation()';
    });
  }

  for (const [search, replace] of Object.entries(replacements)) {
    content = content.split(search).join(replace);
  }
  
  fs.writeFileSync(filePath, content);
}

replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/form-don-tong.tsx'), {
  // Toast / logic strings
  '"Vui lòng nhập mã đơn tổng"': 't("masterOrder.errNoCode")',
  '"Vui lòng thêm ít nhất 1 chi tiết vật tư yêu cầu"': 't("masterOrder.errNoDetails")',
  '"Vui lòng nhập đầy đủ thông tin (vật tư, quy cách) và số lượng > 0"': 't("masterOrder.errInvalidDetail")',
  '"Cập nhật thành công!"': 't("masterOrder.successUpdate")',
  '"Tạo đơn tổng thành công!"': 't("masterOrder.successCreate")',
  '"Có lỗi xảy ra"': 't("masterOrder.errorOccurred")',
  
  // Props strings (wrap with {})
  '"Sửa Đơn Tổng"': '{t("masterOrder.editTitle")}',
  '"Tạo Đơn Tổng Mới"': '{t("masterOrder.createTitle")}',
  '"VD: DT-DA001"': '{t("masterOrder.codePlaceholder")}',
  '"VD: Dự án A"': '{t("masterOrder.namePlaceholder")}',
  '"Ghi chú thêm..."': '{t("masterOrder.notePlaceholder")}',
  '"Chọn..."': '{t("masterOrder.selectPlaceholder")}',
  
  // Ternary logic (do not wrap with {})
  'isEdit ? {t("masterOrder.editTitle")} : {t("masterOrder.createTitle")}': 'isEdit ? t("masterOrder.editTitle") : t("masterOrder.createTitle")',
  'isEdit ? "Lưu thay đổi" : "Tạo mới"': 'isEdit ? t("masterOrder.saveChanges") : t("masterOrder.create")',

  // JSX children
  '>Tạo các yêu cầu nhập vật tư tổng thể cho các dự án lớn.<': '>{t("masterOrder.desc")}<',
  '>Mã đơn tổng<': '>{t("masterOrder.orderCode")}<',
  '>Tên đơn (Tùy chọn)<': '>{t("masterOrder.orderNameOpt")}<',
  '>Ghi chú<': '>{t("common.notes") || t("masterOrder.nameNote")}<',
  '>Chi tiết Vật tư Yêu cầu<': '>{t("masterOrder.materialDetails")}<',
  '> Thêm dòng<': '> {t("masterOrder.addRow")}<',
  '>Dòng #': '>{t("masterOrder.row")} #',
  '>Nguyên liệu<': '>{t("masterOrder.material")}<',
  '>Quy cách<': '>{t("masterOrder.spec")}<',
  '>Số lượng CẦN (': '>{t("masterOrder.requiredQty")} (',
  '>Chưa có chi tiết nào.<': '>{t("masterOrder.noDetailsYet")}<',
  '>Hủy<': '>{t("masterOrder.cancel")}<'
});

replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/don-tong-tab.tsx'), {
  // Logic
  '"Bạn có chắc chắn muốn xóa đơn tổng này? Lịch sử nhập đã liên kết sẽ bị ảnh hưởng."': 't("masterOrder.deleteConfirm")',
  '"Đã xóa đơn tổng"': 't("masterOrder.deletedSuccess")',
  '"Có lỗi khi xóa"': 't("masterOrder.deleteError")',
  'onValueChange={setStatusFilter}': 'onValueChange={(val) => setStatusFilter(val || "ALL")}',
  'onValueChange={setDateFilter}': 'onValueChange={(val) => setDateFilter(val || "ALL")}',
  
  // Props strings
  '"Tìm mã, tên đơn..."': '{t("masterOrder.searchPlaceholder")}',
  '"Trạng thái"': '{t("masterOrder.status")}',
  '"Thời gian"': '{t("masterOrder.time")}',
  
  // JSX children
  '>Tất cả trạng thái<': '>{t("masterOrder.allStatus")}<',
  '>Chưa đủ<': '>{t("masterOrder.statusNotEnough")}<',
  '>Đã đủ<': '>{t("masterOrder.statusEnough")}<',
  '>Mọi lúc<': '>{t("masterOrder.allTime")}<',
  '>Hôm nay<': '>{t("masterOrder.today")}<',
  '>7 ngày qua<': '>{t("masterOrder.last7Days")}<',
  '>Tháng này<': '>{t("masterOrder.thisMonth")}<',
  '> Thêm đơn mới<': '> {t("masterOrder.addNew")}<',
  '>Mã Đơn<': '>{t("masterOrder.orderCode")}<',
  '>Tên / Ghi chú<': '>{t("masterOrder.nameNote")}<',
  '>Tiến độ tổng<': '>{t("masterOrder.totalProgress")}<',
  '>Ngày tạo<': '>{t("masterOrder.createdAt")}<',
  '>Thao tác<': '>{t("masterOrder.action")}<',
  '>Không tìm thấy đơn tổng nào.<': '>{t("masterOrder.notFound")}<',
  '>Chi tiết Yêu cầu & Tiến độ<': '>{t("masterOrder.detailsProgress")}<',
  '>Không có chi tiết.<': '>{t("masterOrder.noDetails")}<',
  '>Nhập: ': '>{t("masterOrder.imported")} '
});

replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/phieu-giao-dich.tsx'), {
  '>Áp dụng cho Đơn tổng (Tùy chọn)<': '>{t("masterOrder.applyFor")}<',
  '"-- Chọn để thêm Đơn tổng --"': '{t("masterOrder.selectToAdd")}',
  '>Thứ tự ưu tiên trừ lùi khi nhập kho:<': '>{t("masterOrder.deductionOrder")}<'
});

console.log("Updated TSX files with FIX SAFE translation keys");
