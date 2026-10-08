# ITKeyBay Knowledge Base

Chào mừng đến với hệ thống tài liệu (Knowledge Base) của dự án **ITKeyBay**. Thư mục này chứa toàn bộ các tài liệu kỹ thuật cốt lõi để phục vụ việc tra cứu, phát triển và mở rộng phần mềm.

## Danh mục tài liệu

1. **[01_SYSTEM_LOGIC_AND_MODULES.md](./01_SYSTEM_LOGIC_AND_MODULES.md)**
   - Tài liệu quan trọng nhất về **Luồng nghiệp vụ (Business Logic)**.
   - Chứa các sơ đồ luồng dữ liệu (Flowcharts) chi tiết cho từng phân hệ: Kho, Sản xuất, Đơn tổng.
   - Giải thích cách dữ liệu luân chuyển và đáp ứng yêu cầu tính năng.

2. **[02_ARCHITECTURE_TECH_STACK.md](./02_ARCHITECTURE_TECH_STACK.md)**
   - Kiến trúc phần mềm và các quyết định công nghệ.
   - Giải thích về Server Actions, cơ chế Realtime SSE ngầm, và kiến trúc Client-Side Localization.
   - Trực quan hóa kiến trúc hệ thống tổng thể.

3. **[03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)**
   - Sơ đồ quan hệ thực thể (ERD).
   - Giải thích chi tiết cách các nhóm dữ liệu (Kho, Giao dịch, Đơn tổng, Công hàng) liên kết và phối hợp với nhau.
   - Giải thích cơ chế View `view_ton_kho_hien_tai` giúp đạt hiệu suất O(1).

4. **[init_database_v2.0.sql](./init_database_v2.0.sql)**
   - File Script SQL tổng hợp duy nhất. Chứa toàn bộ câu lệnh khởi tạo bảng, function, trigger, views và bật Realtime cho database Supabase. Dùng để tái tạo toàn bộ CSDL khi cần.
