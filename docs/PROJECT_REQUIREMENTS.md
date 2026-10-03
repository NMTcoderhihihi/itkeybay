# Yêu cầu Dự án & Mô tả Quy trình Hệ thống

## 1. Tổng quan
Hệ thống là một giải pháp quản lý toàn diện (ERP mini) dành cho xưởng sản xuất, tập trung vào tính minh bạch và truy xuất nguồn gốc chặc chẽ.
Hệ thống bao gồm 3 phân hệ (module) chính liên kết mật thiết với nhau: **Quản lý Kho nguyên liệu**, **Quản lý Sản xuất**, và **Kho Bán thành phẩm**.

---

## 2. Phân hệ 1: Quản lý Kho Nguyên Liệu
- **Cấu trúc Hàng hóa:** Được phân cấp theo `Loại vật tư` (Lưu chung dạng JSON cho quy cách).
- **Quản lý Danh mục Giao dịch:** Người dùng được phép tự thiết lập các lý do Nhập/Xuất kho.
- **Luồng Nhập Kho / Xuất Kho:** Hỗ trợ nhập/xuất theo Lô (Batch), chọn nhiều loại hàng cùng lúc.

---

## 3. Phân hệ 2: Quản lý Sản Xuất
- **Cấu trúc Đơn vị Sản xuất (Công hàng):**
  - Cấp độ 1: **Mã Công hàng** (VD: `26V009-T83525-071VN`).
  - Cấp độ 2: **Mã Đơn hàng** (VD: `1708331BRO`) - Có thể chứa nhiều mã hàng con.
- **Trạng thái Sản xuất (Công hàng):** `Chưa làm`, `Đang làm`, `Đã làm`.
- **Cấp phát nguyên liệu (Phát liệu):** Xảy ra khi công hàng ở trạng thái `Đang làm`. Xác nhận xuất kho nguyên liệu để sử dụng cho công hàng đó.

---

## 4. Phân hệ 4: Quản lý Đơn tổng (Master Order)
- **Khái niệm:** Đơn tổng dùng để gom các yêu cầu vật tư/sản xuất theo một chiến dịch hoặc giai đoạn cụ thể.
- **Quy trình hoạt động:**
  - Lên danh sách các vật tư và số lượng yêu cầu cần thiết cho một Đơn tổng.
  - **Cấp phát linh hoạt (Allocation):** Người dùng có thể rót vật tư từ các Lô giao dịch (Sổ cái) đang có "tồn chưa phân" vào Đơn tổng.
  - **Rút trả kho (Withdrawal):** Người dùng có thể rút bớt vật tư đã rót vào Đơn tổng trả về trạng thái "chưa phân", giúp khắc phục sự cố cấp dư hoặc nhầm lẫn.
  - Hệ thống tự động theo dõi và cập nhật trạng thái của Đơn tổng (`CHUA_DU` hoặc `DA_DU`) dựa trên việc đối chiếu Số lượng đã nhập với Số lượng yêu cầu.

---

## 5. Phân hệ 5: Quản lý Kho Bán Thành Phẩm
Kho Bán thành phẩm được **đơn giản hóa**, không quản lý số lượng chi tiết từng mã hàng nhỏ lẻ, mà **quản lý nguyên một Công hàng**.
- Khi một Công hàng hoàn thành sản xuất (`Đã làm`), nó tự động có trạng thái Kho là **`TON_KHO`** (Tồn kho).
- Khi tiến hành xuất hàng đi giao, người dùng thao tác giao Công hàng đó. Công hàng chuyển trạng thái Kho sang **`DA_GIAO`** (Đã giao).
- Mọi lịch sử giao nhận (kèm ảnh minh chứng) sẽ được gắn trực tiếp vào mã Công hàng.

---

## 6. Yêu cầu Hệ thống Chức năng Chung
- **Hệ thống Upload Đa phương tiện theo Lô (JSONB):** 
  - Trong các thao tác Nhập/Xuất kho và Cấp phát liệu: Bắt buộc đính kèm ảnh/video minh chứng.
  - Các hình ảnh đính kèm (URL) sẽ được lưu gọn trong 1 trường mảng JSONB của Phiếu giao dịch đó (Ví dụ: `[{anh1}, {anh2}]`).
- **Đa ngôn ngữ (Localization):**
  - Hỗ trợ giao diện đa ngôn ngữ linh hoạt.
  - Tập trung vào 3 ngôn ngữ chính: **Tiếng Việt, Tiếng Anh và Tiếng Trung giản thể**.
  - Áp dụng cơ chế **Client-Side Localization** (chuyển đổi ngôn ngữ trực tiếp trên trình duyệt mà không cần tải lại toàn bộ trang từ máy chủ).
- **Quản lý Tài khoản & Truy vết Kế toán:** 
  - Mọi lịch sử giao dịch nguyên liệu được lưu vào Sổ cái Kế toán (Kèm số dư tồn kho tức thời).
