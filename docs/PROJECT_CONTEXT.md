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

3. **Cơ chế Đa ngôn ngữ (Localization):**
   - Sử dụng hook tuỳ chỉnh `useTranslation` (`src/hooks/use-translation.ts`).
   - File JSON đa ngôn ngữ nằm trong `src/locales/` (vi, en, zh).
   - Các Component sử dụng `t('key')` để render chuỗi đa ngôn ngữ.

## Kiến trúc Frontend
- Framework: Next.js 15 (App Router).
- Styling: TailwindCSS + shadcn/ui.
- State Management: Zustand (cho một số Global State) + React Hooks.
- Upload Ảnh: Cloudinary (`next-cloudinary`).

## Mục tiêu tiếp theo
- Hoàn thiện module **Sản xuất (Production)**.
- Triển khai chức năng chấm công, giao việc cho Công nhân.
- Tích hợp quét mã QR/Barcode (nếu cần thiết cho nhập/xuất kho tự động).
