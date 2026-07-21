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

---

## 2. Kiến trúc Dự án (Modern Next.js Architecture)

### 2.1. Cấu trúc Thư mục (Folder Structure)

```text
📦 project-root
 ┣ 📂 app                  # Giao diện các trang
 ┣ 📂 components           # UI Components (Shadcn, Custom)
 ┣ 📂 lib                  # Logic DB, Utils
 ┣ 📂 actions              # Next.js Server Actions (Thao tác DB an toàn)
 ┣ 📂 i18n                 # (MỚI) Chứa các file từ điển JSON cho đa ngôn ngữ
 ┃ ┣ 📜 vi.json            # Từ điển Tiếng Việt
 ┃ ┣ 📜 en.json            # Từ điển Tiếng Anh
 ┃ ┗ 📜 zh.json            # Từ điển Tiếng Trung giản thể
 ┣ 📂 hooks                # Chứa Custom Hook ví dụ useTranslation()
 ┣ 📜 middleware.ts        # Middleware kiểm tra JWT
 ┗ 📜 tailwind.config.js
```
