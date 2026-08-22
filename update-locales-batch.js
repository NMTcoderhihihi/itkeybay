const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const viPath = path.join(localesDir, 'vi.json');
const enPath = path.join(localesDir, 'en.json');
const zhPath = path.join(localesDir, 'zh.json');

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

const newKeys = {
  dashboard: {
    title: { vi: 'Trang chủ', en: 'Dashboard', zh: '主页' },
    totalOrders: { vi: 'Tổng Công Hàng', en: 'Total Orders', zh: '总订单' },
    activeOrdersTitle: { vi: 'Tiến độ Công Hàng Đang Sản Xuất', en: 'Active Orders Progress', zh: '活动订单进度' },
    viewAll: { vi: 'Xem tất cả', en: 'View All', zh: '查看全部' },
    recentActivity: { vi: 'Hoạt động Gần đây', en: 'Recent Activity', zh: '最近活动' },
    materialsLow: { vi: 'Vật tư sắp hết', en: 'Low Materials', zh: '低物料' },
    completed: { vi: 'Hoàn thành', en: 'Completed', zh: '已完成' },
    inProgress: { vi: 'Đang SX', en: 'In Progress', zh: '生产中' },
    pending: { vi: 'Chưa làm', en: 'Pending', zh: '待处理' },
    orderStatusDistribution: { vi: 'Phân bổ Trạng thái', en: 'Status Distribution', zh: '状态分布' },
    renderingChart: { vi: 'Đang dựng biểu đồ...', en: 'Rendering chart...', zh: '正在渲染图表...' },
    objectType: { vi: 'Đối tượng', en: 'Object', zh: '对象' },
    quantity: { vi: 'Số lượng', en: 'Quantity', zh: '数量' },
    proof: { vi: 'Minh chứng', en: 'Proof', zh: '证明' },
    semiProduct: { vi: 'Bán thành phẩm', en: 'Semi-product', zh: '半成品' },
    rawMaterial: { vi: 'Nguyên liệu', en: 'Raw Material', zh: '原料' }
  },
  production: {
    importTitle: { vi: 'Import Công Hàng Hàng Loạt', en: 'Bulk Import Orders', zh: '批量导入订单' },
    importDesc: { vi: 'Copy dữ liệu từ bảng tính (4 cột: Mã Công Hàng | Mã Đơn Hàng | Mã/Tên Hàng | Số lượng) và dán vào ô bên dưới.', en: 'Copy data from spreadsheet (4 columns) and paste below.', zh: '从电子表格复制数据并粘贴在下方。' },
    importStep1: { vi: '1. Dán (Paste) dữ liệu từ Excel:', en: '1. Paste data from Excel:', zh: '1. 从Excel粘贴数据：' },
    importStep2: { vi: '2. Chọn bộ Công đoạn áp dụng chung:', en: '2. Select common stages:', zh: '2. 选择通用阶段：' },
    importStep3: { vi: '3. Xem trước Dữ liệu', en: '3. Preview Data', zh: '3. 预览数据' },
    selectAll: { vi: 'Chọn tất cả', en: 'Select all', zh: '全选' },
    deselectAll: { vi: 'Bỏ chọn tất cả', en: 'Deselect all', zh: '取消全选' },
    confirmImport: { vi: 'Xác nhận Import', en: 'Confirm Import', zh: '确认导入' },
    orderCountCol: { vi: 'Số Đơn Hàng Con', en: 'Sub-orders', zh: '子订单数' },
    detailCol: { vi: 'Chi tiết các đơn', en: 'Order Details', zh: '订单详情' },
    errorNoStage: { vi: 'Vui lòng chọn ít nhất 1 công đoạn áp dụng chung', en: 'Please select at least 1 stage', zh: '请至少选择1个阶段' },
    importSuccess: { vi: 'Đã import thành công', en: 'Successfully imported', zh: '成功导入' },
    orderInfo: { vi: 'Thông tin Công Hàng', en: 'Order Info', zh: '订单信息' },
    cancelOrder: { vi: 'Hủy công hàng', en: 'Cancel Order', zh: '取消订单' },
    startProduction: { vi: 'Bắt đầu Sản xuất', en: 'Start Production', zh: '开始生产' },
    issueMaterial: { vi: 'Cấp / Phát Liệu', en: 'Issue Material', zh: '发放物料' },
    markCompleted: { vi: 'Chốt Hoàn Thành', en: 'Mark Completed', zh: '标记完成' },
    exportSemiProduct: { vi: 'Xuất BTP', en: 'Export Semi-product', zh: '出口半成品' },
    delivered: { vi: 'Đã giao hàng', en: 'Delivered', zh: '已交货' },
    delete: { vi: 'Xóa', en: 'Delete', zh: '删除' },
    overallProgress: { vi: 'Tiến độ Tổng quan', en: 'Overall Progress', zh: '总体进度' },
    stepsCompleted: { vi: 'Hoàn thành {completed}/{total} bước', en: 'Completed {completed}/{total} steps', zh: '已完成 {completed}/{total} 步' },
    orderDetails: { vi: 'Chi tiết Đơn Hàng', en: 'Order Details', zh: '订单详情' },
    add: { vi: '+ Thêm', en: '+ Add', zh: '+ 添加' },
    orderCodePlaceholder: { vi: 'Mã đơn hàng', en: 'Order code', zh: '订单代码' },
    productCodePlaceholder: { vi: 'Mã sản phẩm', en: 'Product code', zh: '产品代码' },
    notes: { vi: 'Ghi chú', en: 'Notes', zh: '备注' },
    noNotes: { vi: 'Không có ghi chú', en: 'No notes', zh: '无备注' },
    stageAssignment: { vi: 'Phân công & Tiến độ chi tiết', en: 'Assignment & Progress Details', zh: '分配和进度详情' },
    stageDone: { vi: 'Đã xong', en: 'Done', zh: '完成' },
    unknownStage: { vi: 'Công đoạn không xác định', en: 'Unknown stage', zh: '未知阶段' },
    workerLabel: { vi: 'Công nhân', en: 'Worker', zh: '工人' },
    cancel: { vi: 'Hủy', en: 'Cancel', zh: '取消' },
    confirmDone: { vi: 'Xác nhận xong', en: 'Confirm done', zh: '确认完成' },
    waiting: { vi: 'Đang chờ...', en: 'Waiting...', zh: '等待中...' },
    materialHistory: { vi: 'Lịch sử Cấp / Phát Liệu (Kho)', en: 'Material Issue History', zh: '发料历史' },
    noHistory: { vi: 'Chưa có lịch sử giao dịch', en: 'No transaction history', zh: '无交易历史' },
    transactionCode: { vi: 'Mã giao dịch', en: 'Transaction Code', zh: '交易代码' },
    time: { vi: 'Thời gian', en: 'Time', zh: '时间' },
    executor: { vi: 'Người thực hiện', en: 'Executor', zh: '执行者' },
    typeAndContent: { vi: 'Loại & Nội dung', en: 'Type & Content', zh: '类型和内容' },
    materialDetails: { vi: 'Chi tiết vật tư', en: 'Material Details', zh: '物料详情' },
    noMaterialDetails: { vi: 'Không có vật tư chi tiết', en: 'No material details', zh: '无物料详情' },
    noProof: { vi: 'Không có', en: 'None', zh: '无' },
    completeOrderTitle: { vi: 'Hoàn thành Công hàng', en: 'Complete Order', zh: '完成订单' },
    completeOrderDesc: { vi: 'Tải lên ảnh Bán thành phẩm để chuyển hàng vào kho.', en: 'Upload Semi-product photo to move to warehouse.', zh: '上传半成品照片以移至仓库。' },
    confirm: { vi: 'Xác nhận', en: 'Confirm', zh: '确认' },
    exportWarehouse: { vi: 'Xuất Kho (Giao hàng)', en: 'Export Warehouse (Delivery)', zh: '出库（交货）' },
    exportItem: { vi: 'Mục xuất', en: 'Export Item', zh: '出口项目' },
    selectCategory: { vi: '-- Chọn danh mục --', en: '-- Select category --', zh: '-- 选择类别 --' },
    deliveryPhoto: { vi: 'Ảnh giao hàng', en: 'Delivery Photo', zh: '交货照片' },
    confirmDelivery: { vi: 'Xác nhận Giao', en: 'Confirm Delivery', zh: '确认交货' }
  },
  warehouse: {
    overviewTab: { vi: 'Tổng quan', en: 'Overview', zh: '概览' },
    transactionsTab: { vi: 'Phiếu giao dịch', en: 'Transactions', zh: '交易' },
    semiProductTab: { vi: 'Bán thành phẩm', en: 'Semi-products', zh: '半成品' },
    totalMaterials: { vi: 'Tổng Nguyên Liệu', en: 'Total Materials', zh: '总原料' },
    lowStock: { vi: 'Cảnh báo Tồn kho', en: 'Low Stock Alert', zh: '低库存警告' },
    totalTransactions: { vi: 'Lượt Giao Dịch', en: 'Total Transactions', zh: '总交易' },
    stockValue: { vi: 'Giá trị Tồn kho', en: 'Stock Value', zh: '库存价值' },
    searchMaterial: { vi: 'Tìm kiếm vật tư...', en: 'Search materials...', zh: '搜索物料...' },
    filterCategory: { vi: 'Lọc theo danh mục', en: 'Filter by category', zh: '按类别过滤' },
    createTransaction: { vi: 'Tạo phiếu giao dịch', en: 'Create Transaction', zh: '创建交易' },
    exportPdf: { vi: 'Xuất PDF', en: 'Export PDF', zh: '导出PDF' },
    materialCode: { vi: 'Mã vật tư', en: 'Material Code', zh: '物料代码' },
    materialName: { vi: 'Tên vật tư', en: 'Material Name', zh: '物料名称' },
    unit: { vi: 'Đơn vị', en: 'Unit', zh: '单位' },
    currentStock: { vi: 'Tồn hiện tại', en: 'Current Stock', zh: '当前库存' },
    specifications: { vi: 'Quy cách', en: 'Specs', zh: '规格' },
    importAction: { vi: 'Nhập', en: 'Import', zh: '入库' },
    exportAction: { vi: 'Xuất', en: 'Export', zh: '出库' },
    noData: { vi: 'Không có dữ liệu', en: 'No data', zh: '无数据' },
    transactionHistory: { vi: 'Lịch sử Giao dịch', en: 'Transaction History', zh: '交易历史' },
    createImportExport: { vi: 'Tạo phiếu Nhập / Xuất', en: 'Create Import/Export', zh: '创建入库/出库' },
    dateRange: { vi: 'Khoảng thời gian', en: 'Date Range', zh: '日期范围' },
    transactionType: { vi: 'Loại GD', en: 'Trans. Type', zh: '交易类型' },
    actor: { vi: 'Người thực hiện', en: 'Actor', zh: '执行人' },
    viewDetails: { vi: 'Xem chi tiết', en: 'View Details', zh: '查看详情' },
    searchOrder: { vi: 'Tìm theo mã công hàng...', en: 'Search order code...', zh: '按订单代码搜索...' },
    statusFilter: { vi: 'Lọc trạng thái', en: 'Status Filter', zh: '状态过滤器' }
  }
};

const mergeKeys = (target, sourceObj, lang) => {
  for (const module in sourceObj) {
    if (!target[module]) target[module] = {};
    for (const key in sourceObj[module]) {
      target[module][key] = sourceObj[module][key][lang];
    }
  }
};

mergeKeys(vi, newKeys, 'vi');
mergeKeys(en, newKeys, 'en');
mergeKeys(zh, newKeys, 'zh');

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2));

console.log('Successfully updated locales!');
