# Project Context (Ngữ cảnh Dự án)

Tài liệu này lưu trữ ngữ cảnh của dự án để các LLM Agent mới có thể nắm bắt nhanh chóng tiến độ và định hướng tiếp theo.

## Trạng thái hiện tại
Dự án đã hoàn thiện các module cơ bản sau:
1. **Module Kho (Inventory):**
   - Đã có UI đa ngôn ngữ đầy đủ.
   - Thẻ Tồn kho & Danh mục vật tư sử dụng Grid Responsive, hiển thị hình ảnh đúng tỉ lệ (`object-contain`).
   - Phiếu giao dịch (Nhập/Xuất): Bắt buộc người dùng phải sử dụng điện thoại để quét/chụp ảnh minh chứng trực tiếp (real-time). Trên Desktop sẽ bị chặn để ngăn gian lận.
   - Sổ cái vật tư (Ledger): Hiển thị chi tiết biến động kèm ảnh minh chứng giao dịch (cho phép phóng to ảnh).

2. **Module Danh mục & Nhân sự:**
   - Quản lý danh mục lý do giao dịch.
   - Quản lý Tài khoản (đăng nhập bằng SDT/Mật khẩu) và Công nhân (chấm công, giao việc).
   - Có tích hợp Upload ảnh đại diện.

3. **Module Quản lý Đơn tổng (Master Order):**
   - Đã tái cấu trúc Database, sử dụng bảng trung gian `chi_tiet_cap_phat` và trigger đồng bộ để quản lý việc "Rót vật tư" từ Sổ cái sang Đơn tổng.
   - Hỗ trợ thao tác Rút/Cấp vật tư (Withdraw / Allocate) thông qua giao diện Popup tích hợp 2 tab.
   - UI danh sách chi tiết sử dụng thẻ Grid 2 cột tự động (Auto Layout).
   - Vòng tròn tiến độ thông minh: Khắc phục lỗi làm tròn sai lệch (ví dụ 99.8% thành 100%), giới hạn trần ở 99% nếu chưa thực sự hoàn tất 100% để ngăn chặn hiểu nhầm.
   - Xử lý mượt mà cơ chế Cache của Next.js (bằng `revalidatePath('/kho', 'layout')`) để đảm bảo tiến độ ở màn hình danh sách bên ngoài cập nhật tức thì.

4. **Module Sản xuất (Production) & Kho Bán Thành Phẩm:**
   - Quản lý Công hàng (Tạo công hàng mới, danh sách hiển thị dạng Thẻ/Bảng linh hoạt, tích hợp bảng giao dịch BTP kèm cột ảnh minh chứng).
   - Quản lý Danh mục Công đoạn mẫu (`cong-doan-manager.tsx`) và thiết lập quy trình cho công hàng.
   - Chi tiết công hàng & giám sát tiến độ (`detail-client.tsx`):
     - Phân công công nhân cho từng công đoạn: dropdown hiển thị rõ Họ tên - Vị trí chuyên môn (`vai_tro`) - Mã công nhân.
     - Lịch sử tiến độ công đoạn (`history-cong-doan-modal.tsx`): ghi nhận ngày giờ, công nhân thực hiện và hình ảnh nghiệm thu hoàn thành.
     - Lịch sử phát liệu (cấp tư): hiển thị ngày giờ đầy đủ (`dd/MM/yyyy HH:mm`), tên nguyên liệu, quy cách và số lượng biến động.
     - Chuyển trạng thái sản xuất (`CHUA_LAM` -> `DANG_LAM` -> `DA_LAM`) và kết nối tự động sang Kho Bán thành phẩm (`TON_KHO` / `DA_GIAO`).

5. **Cơ chế Đa ngôn ngữ (Localization):**
   - Sử dụng hook tuỳ chỉnh `useTranslation` (`src/hooks/use-translation.ts`).
   - File JSON đa ngôn ngữ nằm trong `src/locales/` (`vi.json`, `en.json`, `zh.json`) với đầy đủ từ điển cho cả Kho, Nhân sự và Sản xuất (bao gồm toàn bộ các popup, modal và thông báo).
   - Các Component sử dụng `t('key')` để render chuỗi đa ngôn ngữ.

## Kiến trúc Frontend
- Framework: Next.js 15 (App Router).
- Styling: TailwindCSS + shadcn/ui.
- State Management: Zustand (cho một số Global State) + React Hooks.
- Upload Ảnh: Cloudinary (`next-cloudinary`).
- Realtime: Sử dụng hook `useRealtimeSSE` tự động đồng bộ dữ liệu khi có thay đổi.

## Mục tiêu tiếp theo
- Triển khai chức năng chấm công chi tiết và thống kê năng suất cho Công nhân.
- Tích hợp quét mã QR/Barcode (nếu cần thiết cho nhập/xuất kho tự động).
- Bổ sung các báo cáo tổng hợp và biểu đồ xuất nhập kho trên Dashboard.
