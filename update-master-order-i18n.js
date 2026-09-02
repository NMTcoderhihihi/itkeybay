const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const langs = ['vi', 'en', 'zh'];

const newKeys = {
  masterOrder: {
    title: { vi: 'Quản lý Đơn tổng', en: 'Master Order Management', zh: '主订单管理' },
    searchPlaceholder: { vi: 'Tìm mã, tên đơn...', en: 'Search code, name...', zh: '搜索代码，名称...' },
    status: { vi: 'Trạng thái', en: 'Status', zh: '状态' },
    allStatus: { vi: 'Tất cả trạng thái', en: 'All statuses', zh: '所有状态' },
    statusNotEnough: { vi: 'Chưa đủ', en: 'Not enough', zh: '不足' },
    statusEnough: { vi: 'Đã đủ', en: 'Enough', zh: '充足' },
    time: { vi: 'Thời gian', en: 'Time', zh: '时间' },
    allTime: { vi: 'Mọi lúc', en: 'All time', zh: '所有时间' },
    today: { vi: 'Hôm nay', en: 'Today', zh: '今天' },
    last7Days: { vi: '7 ngày qua', en: 'Last 7 days', zh: '过去7天' },
    thisMonth: { vi: 'Tháng này', en: 'This month', zh: '本月' },
    addNew: { vi: 'Thêm đơn mới', en: 'Add new order', zh: '添加新订单' },
    orderCode: { vi: 'Mã Đơn', en: 'Order Code', zh: '订单代码' },
    nameNote: { vi: 'Tên / Ghi chú', en: 'Name / Note', zh: '名称 / 备注' },
    totalProgress: { vi: 'Tiến độ tổng', en: 'Total progress', zh: '总进度' },
    createdAt: { vi: 'Ngày tạo', en: 'Created date', zh: '创建日期' },
    action: { vi: 'Thao tác', en: 'Action', zh: '操作' },
    notFound: { vi: 'Không tìm thấy đơn tổng nào.', en: 'No master orders found.', zh: '未找到主订单。' },
    deleteConfirm: { vi: 'Bạn có chắc chắn muốn xóa đơn tổng này? Lịch sử nhập đã liên kết sẽ bị ảnh hưởng.', en: 'Are you sure you want to delete this master order? Linked import history will be affected.', zh: '您确定要删除此主订单吗？链接的导入历史记录将受影响。' },
    deletedSuccess: { vi: 'Đã xóa đơn tổng', en: 'Master order deleted', zh: '已删除主订单' },
    deleteError: { vi: 'Có lỗi khi xóa', en: 'Error deleting', zh: '删除时出错' },
    detailsProgress: { vi: 'Chi tiết Yêu cầu & Tiến độ', en: 'Requirements & Progress Details', zh: '要求和进度详情' },
    noDetails: { vi: 'Không có chi tiết.', en: 'No details.', zh: '没有详情。' },
    imported: { vi: 'Nhập:', en: 'Imported:', zh: '已导入:' },
    editTitle: { vi: 'Sửa Đơn Tổng', en: 'Edit Master Order', zh: '编辑主订单' },
    createTitle: { vi: 'Tạo Đơn Tổng Mới', en: 'Create New Master Order', zh: '创建新主订单' },
    desc: { vi: 'Tạo các yêu cầu nhập vật tư tổng thể cho các dự án lớn.', en: 'Create overall material import requests for large projects.', zh: '为大型项目创建整体材料进口请求。' },
    codePlaceholder: { vi: 'VD: DT-DA001', en: 'Ex: MO-PRJ001', zh: '例如：MO-PRJ001' },
    orderNameOpt: { vi: 'Tên đơn (Tùy chọn)', en: 'Order name (Optional)', zh: '订单名称 (可选)' },
    namePlaceholder: { vi: 'VD: Dự án A', en: 'Ex: Project A', zh: '例如：项目 A' },
    notePlaceholder: { vi: 'Ghi chú thêm...', en: 'Additional notes...', zh: '附加说明...' },
    materialDetails: { vi: 'Chi tiết Vật tư Yêu cầu', en: 'Requested Material Details', zh: '所需材料详情' },
    addRow: { vi: 'Thêm dòng', en: 'Add row', zh: '添加行' },
    row: { vi: 'Dòng', en: 'Row', zh: '行' },
    material: { vi: 'Nguyên liệu', en: 'Material', zh: '材料' },
    selectPlaceholder: { vi: 'Chọn...', en: 'Select...', zh: '选择...' },
    spec: { vi: 'Quy cách', en: 'Spec', zh: '规格' },
    requiredQty: { vi: 'Số lượng CẦN', en: 'Required Qty', zh: '需求数量' },
    noDetailsYet: { vi: 'Chưa có chi tiết nào.', en: 'No details yet.', zh: '暂无详情。' },
    cancel: { vi: 'Hủy', en: 'Cancel', zh: '取消' },
    saveChanges: { vi: 'Lưu thay đổi', en: 'Save changes', zh: '保存更改' },
    create: { vi: 'Tạo mới', en: 'Create', zh: '创建' },
    errNoCode: { vi: 'Vui lòng nhập mã đơn tổng', en: 'Please enter master order code', zh: '请输入主订单代码' },
    errNoDetails: { vi: 'Vui lòng thêm ít nhất 1 chi tiết vật tư yêu cầu', en: 'Please add at least 1 requested material detail', zh: '请添加至少1个所需材料详情' },
    errInvalidDetail: { vi: 'Vui lòng nhập đầy đủ thông tin (vật tư, quy cách) và số lượng > 0', en: 'Please enter full info (material, spec) and qty > 0', zh: '请输入完整信息（材料，规格）且数量>0' },
    successUpdate: { vi: 'Cập nhật thành công!', en: 'Update successful!', zh: '更新成功！' },
    successCreate: { vi: 'Tạo đơn tổng thành công!', en: 'Master order created successfully!', zh: '主订单创建成功！' },
    errorOccurred: { vi: 'Có lỗi xảy ra', en: 'An error occurred', zh: '发生错误' },
    applyFor: { vi: 'Áp dụng cho Đơn tổng (Tùy chọn)', en: 'Apply to Master Order (Optional)', zh: '应用于主订单（可选）' },
    selectToAdd: { vi: '-- Chọn để thêm Đơn tổng --', en: '-- Select to add Master Order --', zh: '-- 选择以添加主订单 --' },
    deductionOrder: { vi: 'Thứ tự ưu tiên trừ lùi khi nhập kho:', en: 'Deduction priority order when importing:', zh: '导入时的扣除优先级：' }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesDir, lang + '.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  data.masterOrder = {};
  for (const [key, value] of Object.entries(newKeys.masterOrder)) {
    data.masterOrder[key] = value[lang];
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
});

console.log("Updated masterOrder keys in JSON files");
