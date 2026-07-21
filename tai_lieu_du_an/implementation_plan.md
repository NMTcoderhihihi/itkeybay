# Kế hoạch Triển khai Hệ thống Quản lý Kho

Mục tiêu: Xây dựng hệ thống MVP để thử nghiệm, ưu tiên **tốc độ phát triển cực nhanh** và chi phí 0đ.

## User Review Required
> [!IMPORTANT]
> Tài liệu đã được cập nhật: 
> 1. Tự triển khai Auth trên Next.js (bỏ qua Supabase Auth và RLS).
> 2. Đơn giản hóa kiến trúc DB (Gộp ảnh, công đoạn vào JSONB, loại bỏ bảng trung gian).
> 3. **Bổ sung tính năng Đa ngôn ngữ (Tiếng Việt, Anh, Trung) theo cơ chế Client-Side Localization.**
> 
> Vui lòng xác nhận sự thay đổi này trước khi tôi bắt đầu gõ lệnh cài đặt code nhé!

## 1. Đề xuất Tổ hợp Công nghệ (Tech Stack MVP)

- **Frontend, API & Authentication:** **Next.js** (App Router). 
  - **Đa ngôn ngữ (i18n):** Sử dụng các thư viện i18n gọn nhẹ ở phía Client (Ví dụ: Zustand Context + JSON dictionaries) để đảm bảo chuyển đổi ngôn ngữ tức thì giữa Tiếng Việt, Anh và Trung giản thể.
  - **Bảo mật & Phiên:** Tự quản lý tài khoản, mã hóa mật khẩu, và Session (HTTP-only Cookie) qua Middleware.
- **Database:** **Supabase** (PostgreSQL). Query trực tiếp qua API Keys (Service Role Key).
- **Media Storage:** **Cloudinary**.
- **UI & Styling:** Tailwind CSS + Shadcn UI.

---

## 2. Thiết kế Cơ sở dữ liệu (Database Schema)

*(Cấu trúc 7 bảng tinh gọn như đã chốt bằng JSONB)*

---

## 3. Các giai đoạn Thực hiện (Roadmap)

### Giai đoạn 1: Khởi tạo và Cấu hình (Setup)
- Khởi tạo dự án Next.js (Tailwind + TypeScript).
- Cài đặt Shadcn UI, Supabase Client và Cloudinary.
- **Thiết lập thư mục `i18n`, tạo các file từ điển JSON (`vi`, `en`, `zh`) và State chuyển đổi ngôn ngữ (Client-Side).**

### Giai đoạn 2: Tự triển khai Xác thực (Custom Auth)
- Viết Server Action xử lý Đăng nhập: Mã hóa JWT vào HTTP-only Cookie.
- Xây dựng `middleware.ts` để bảo vệ routes.

### Giai đoạn 3: Luồng Nhập/Xuất kho (Inbound/Outbound)
- Xây dựng **Cloudinary Upload Component** (Hỗ trợ upload ảnh/video).
- Xây dựng màn hình Form Nhập/Xuất kho (Đã tích hợp hook đa ngôn ngữ trên form).

### Giai đoạn 4: Giám sát và Hoàn thiện (Views & Polish)
- Màn hình Dashboard cho Quản lý.
- Tinh chỉnh giao diện trên điện thoại và gắn nút chuyển đổi (Toggle) 3 ngôn ngữ (Việt - Anh - Trung) vào thanh điều hướng.
