# Tech Stack (Công nghệ sử dụng)

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Ngôn ngữ:** TypeScript
- **Database / Backend:** Supabase (PostgreSQL), sử dụng `@supabase/supabase-js` để truy vấn trực tiếp từ Server Actions.
- **Styling:** TailwindCSS, `lucide-react` cho icons.
- **UI Components:** shadcn/ui (Radix UI primitives).
- **Notifications:** `sonner` (Toast).
- **Media Upload:** Cloudinary (`next-cloudinary`, `CldUploadWidget`).
- **Translation:** Custom JSON-based translation (`src/hooks/use-translation.ts` & `src/locales/`).

## Lưu ý đặc biệt
- Các thao tác với CSDL (CRUD) phải được thực hiện thông qua **Server Actions** (`src/app/actions/`) thay vì gọi trực tiếp từ Client Components để bảo mật khóa API.
- Các ảnh tải lên từ thiết bị phải đảm bảo tính xác thực thời gian thực (real-time camera) cho mục đích nghiệp vụ, do đó module Phiếu giao dịch đã chặn quyền tải ảnh từ thư viện trên máy tính/điện thoại, bắt buộc phải dùng camera để chụp ảnh minh chứng.
