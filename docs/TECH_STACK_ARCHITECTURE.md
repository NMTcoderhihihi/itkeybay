# Kiến trúc và Công nghệ Dự án (Tech Stack & Architecture)

## 1. Tổ hợp Công nghệ (Tech Stack)

### 1.1. Frontend & Meta-Framework: Next.js 14+ (App Router)
- Cung cấp kiến trúc Server Components kết hợp Client Components.

### 1.2. Đa ngôn ngữ (i18n): Client-Side Localization
- **Vai trò:** Hỗ trợ 3 ngôn ngữ: **Tiếng Việt, Tiếng Anh, Tiếng Trung Giản Thể**.
- **Cách tiếp cận:** Quản lý tệp từ điển (`vi.json`, `en.json`, `zh.json`) ở phía Client. Sử dụng Context API hoặc Zustand state manager để thay đổi ngôn ngữ động trên giao diện (Client Components) mà không làm tải lại trang (No page reload), mang lại trải nghiệm mượt mà siêu tốc.

### 1.3. Database: Supabase (PostgreSQL)
- Bỏ qua RLS, thao tác trực tiếp qua Server Actions để tăng tốc độ MVP. 
- Sử dụng mạnh mẽ cấu trúc NoSQL (Cột JSONB) cho mảng dữ liệu ảnh và quy trình sản xuất.

### 1.4. Authentication (Xác thực): Tự triển khai trên Next.js
- Mã hóa mật khẩu (bcrypt), quản lý bằng JWT lưu trong HTTP-only Cookie và chặn bằng Middleware.

### 1.5. Media Storage: Cloudinary
- Xử lý mượt mà tác vụ upload Video và hình ảnh chứng từ.

### 1.6. Giao diện (UI/UX): Tailwind CSS & Shadcn UI
- Phát triển siêu tốc, mobile-first.

### 1.7. Realtime Synchronization: Global Centralized SSE Gateway (v1 - 26/07/2026)
- **Cổng SSE Trung tâm (`/api/sse`)**: Trình duyệt chỉ duy trì **01 kết nối EventSource duy nhất** thông qua `<RealtimeProvider>` (`src/components/realtime-provider.tsx`), lắng nghe biến động từ Supabase Realtime Channel (`postgres_changes`) trên toàn bộ các bảng nghiệp vụ (`lo_giao_dich`, `so_cai_vat_tu`, `nguyen_lieu`, `cong_hang`, `don_hang`...).
- **Đồng bộ Ngầm Yên lặng (Silent Background Refresh UX)**: Khi có sự kiện thay đổi dữ liệu từ các bộ phận trong nhà xưởng, hook `useRealtimeSSE` thực hiện tải lại dữ liệu ngầm (`router.refresh()`) mà **không bật thông báo Toast** làm phiền, giữ nguyên 100% trạng thái cuộn trang và nội dung đang gõ của người làm việc.

---

## 2. Kiến trúc Dự án (Modern Next.js Architecture)

### 2.1. Cấu trúc Thư mục (Folder Structure)

```text
📦 project-root
 ┣ 📂 app                  # Giao diện các trang
 ┃ ┣ 📂 (main)             # Layout chính (được bao bọc bởi <RealtimeProvider>)
 ┃ ┃ ┣ 📂 kho              # Quản lý kho nguyên liệu (Realtime SSE)
 ┃ ┃ ┣ 📂 san-xuat         # Quản lý tiến độ sản xuất & BTP (Realtime SSE)
 ┃ ┃ ┗ 📂 dashboard        # Dashboard KPI tổng quan (Realtime SSE Highlight UX)
 ┃ ┗ 📂 api
 ┃   ┗ 📂 sse              # Global Realtime SSE Gateway (/api/sse)
 ┣ 📂 components           # UI Components (Shadcn, Custom, realtime-provider.tsx)
 ┣ 📂 lib                  # Logic DB, Utils
 ┣ 📂 actions              # Next.js Server Actions (Thao tác DB an toàn)
 ┣ 📂 i18n                 # Chứa các file từ điển JSON cho đa ngôn ngữ
 ┃ ┣ 📜 vi.json            # Từ điển Tiếng Việt
 ┃ ┣ 📜 en.json            # Từ điển Tiếng Anh
 ┃ ┗ 📜 zh.json            # Từ điển Tiếng Trung giản thể
 ┣ 📂 hooks                # Chứa Custom Hook ví dụ useTranslation()
 ┣ 📜 middleware.ts        # Middleware kiểm tra JWT
 ┗ 📜 tailwind.config.js
```
