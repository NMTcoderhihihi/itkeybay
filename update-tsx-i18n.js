const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasTranslationImport = content.includes('useTranslation');
  
  if (!hasTranslationImport) {
    content = 'import { useTranslation } from "@/hooks/use-translation"\n' + content;
  }
  
  // Make sure t is destructured if it's not
  if (!content.includes('const { t } = useTranslation()')) {
    // find the first component export and inject it
    content = content.replace(/export function (\w+)\s*\([^)]*\)\s*\{/, (match) => {
      return match + '\n  const { t } = useTranslation()';
    });
  }

  for (const [search, replace] of Object.entries(replacements)) {
    // using split join to replace all occurrences
    content = content.split(search).join(replace);
  }
  
  fs.writeFileSync(filePath, content);
}

// 1. Update form-don-tong.tsx
replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/form-don-tong.tsx'), {
  '"Vui lòng nhập mã đơn tổng"': 't("masterOrder.errNoCode")',
  '"Vui lòng thêm ít nhất 1 chi tiết vật tư yêu cầu"': 't("masterOrder.errNoDetails")',
  '"Vui lòng nhập đầy đủ thông tin (vật tư, quy cách) và số lượng > 0"': 't("masterOrder.errInvalidDetail")',
  '"Cập nhật thành công!"': 't("masterOrder.successUpdate")',
  '"Tạo đơn tổng thành công!"': 't("masterOrder.successCreate")',
  '"Có lỗi xảy ra"': 't("masterOrder.errorOccurred")',
  'isEdit ? "Sửa Đơn Tổng" : "Tạo Đơn Tổng Mới"': 'isEdit ? t("masterOrder.editTitle") : t("masterOrder.createTitle")',
  'Tạo các yêu cầu nhập vật tư tổng thể cho các dự án lớn.': '{t("masterOrder.desc")}',
  'Mã đơn tổng</Label>': '{t("masterOrder.orderCode")}</Label>',
  '"VD: DT-DA001"': 't("masterOrder.codePlaceholder")',
  'Tên đơn (Tùy chọn)</Label>': '{t("masterOrder.orderNameOpt")}</Label>',
  '"VD: Dự án A"': 't("masterOrder.namePlaceholder")',
  'Ghi chú</Label>': '{t("common.notes") || t("masterOrder.nameNote")}</Label>',
  '"Ghi chú thêm..."': 't("masterOrder.notePlaceholder")',
  'Chi tiết Vật tư Yêu cầu</Label>': '{t("masterOrder.materialDetails")}</Label>',
  'Thêm dòng': '{t("masterOrder.addRow")}',
  'Dòng #': '{t("masterOrder.row")} #',
  'Nguyên liệu</Label>': '{t("masterOrder.material")}</Label>',
  '"Chọn..."': 't("masterOrder.selectPlaceholder")',
  'Quy cách</Label>': '{t("masterOrder.spec")}</Label>',
  'Số lượng CẦN': '{t("masterOrder.requiredQty")}',
  'Chưa có chi tiết nào.': '{t("masterOrder.noDetailsYet")}',
  'Hủy</Button>': '{t("masterOrder.cancel")}</Button>',
  'isEdit ? "Lưu thay đổi" : "Tạo mới"': 'isEdit ? t("masterOrder.saveChanges") : t("masterOrder.create")'
});

// 2. Update don-tong-tab.tsx
replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/don-tong-tab.tsx'), {
  '"Bạn có chắc chắn muốn xóa đơn tổng này? Lịch sử nhập đã liên kết sẽ bị ảnh hưởng."': 't("masterOrder.deleteConfirm")',
  '"Đã xóa đơn tổng"': 't("masterOrder.deletedSuccess")',
  '"Có lỗi khi xóa"': 't("masterOrder.deleteError")',
  '"Tìm mã, tên đơn..."': 't("masterOrder.searchPlaceholder")',
  '"Trạng thái"': 't("masterOrder.status")',
  'Tất cả trạng thái': '{t("masterOrder.allStatus")}',
  '>Chưa đủ<': '>{t("masterOrder.statusNotEnough")}<',
  '>Đã đủ<': '>{t("masterOrder.statusEnough")}<',
  '"Thời gian"': 't("masterOrder.time")',
  'Mọi lúc': '{t("masterOrder.allTime")}',
  'Hôm nay': '{t("masterOrder.today")}',
  '7 ngày qua': '{t("masterOrder.last7Days")}',
  'Tháng này': '{t("masterOrder.thisMonth")}',
  'Thêm đơn mới': '{t("masterOrder.addNew")}',
  '>Mã Đơn<': '>{t("masterOrder.orderCode")}<',
  '>Tên / Ghi chú<': '>{t("masterOrder.nameNote")}<',
  '>Tiến độ tổng<': '>{t("masterOrder.totalProgress")}<',
  '>Ngày tạo<': '>{t("masterOrder.createdAt")}<',
  '>Thao tác<': '>{t("masterOrder.action")}<',
  'Không tìm thấy đơn tổng nào.': '{t("masterOrder.notFound")}',
  'Chi tiết Yêu cầu & Tiến độ': '{t("masterOrder.detailsProgress")}',
  'Không có chi tiết.': '{t("masterOrder.noDetails")}',
  'Nhập: ': '{t("masterOrder.imported")} '
});

// 3. Update phieu-giao-dich.tsx
replaceInFile(path.join(__dirname, 'src/app/(main)/kho/components/phieu-giao-dich.tsx'), {
  'Áp dụng cho Đơn tổng (Tùy chọn)': '{t("masterOrder.applyFor")}',
  '"-- Chọn để thêm Đơn tổng --"': 't("masterOrder.selectToAdd")',
  'Thứ tự ưu tiên trừ lùi khi nhập kho:': '{t("masterOrder.deductionOrder")}'
});

console.log("Updated TSX files with translation keys");
