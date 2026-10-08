# Sơ đồ Cơ sở dữ liệu và Mô hình Phối hợp (Database Schema)

Tài liệu này giải thích chi tiết cấu trúc các bảng (Tables) hiện tại, các quan hệ (Relationships), và cách chúng phối hợp thành các nhóm (Groups) để giải quyết bài toán nghiệp vụ lõi (Kho, Đơn Tổng, Sản xuất).

---

## 1. Sơ đồ Quan hệ Thực thể (ERD Toàn Hệ Thống)

Sơ đồ dưới đây thể hiện toàn bộ **11 bảng** hiện có trong hệ thống và các mối liên kết (Foreign Keys & Logical Links) giữa chúng.

```mermaid
erDiagram
    %% ==========================================
    %% QUAN HỆ (RELATIONSHIPS)
    %% ==========================================
    tai_khoan ||--o{ lo_giao_dich : "Tạo giao dịch"
    danh_muc_giao_dich ||--o{ lo_giao_dich : "Phân loại"
    
    lo_giao_dich ||--o{ so_cai_vat_tu : "Ghi nhận biến động (1-N)"
    nguyen_lieu ||--o{ so_cai_vat_tu : "Định danh vật tư"
    
    don_tong ||--|{ don_tong_chi_tiet : "Chứa nhiều chi tiết"
    nguyen_lieu ||--o{ don_tong_chi_tiet : "Yêu cầu vật tư"
    
    %% Mối liên kết logic (JSONB Array)
    lo_giao_dich }o..o{ don_tong_chi_tiet : "Link qua danh_sach_don_tong (JSONB)"
    
    cong_hang ||--o{ don_hang : "Sản xuất cho (1-N)"
    cong_hang ||--o{ lo_giao_dich : "Phiếu xuất kho cho SX (Nullable)"
    
    cong_nhan }o..o{ cong_hang : "Link qua danh_sach_cong_doan (JSONB)"
    cong_doan }o..o{ cong_hang : "Link qua danh_sach_cong_doan (JSONB)"

    %% ==========================================
    %% ĐỊNH NGHĨA CÁC BẢNG (ENTITIES)
    %% ==========================================
    tai_khoan {
        uuid id PK
        varchar tai_khoan "Tên đăng nhập"
        varchar mat_khau
        varchar vai_tro "Quan ly, Nhan vien"
        varchar ho_ten
        boolean dang_hoat_dong
    }
    
    nguyen_lieu {
        uuid id PK
        varchar ten_nguyen_lieu
        varchar don_vi
        jsonb danh_sach_quy_cach "Mảng chứa định lượng/màu sắc"
    }

    danh_muc_giao_dich {
        uuid id PK
        enum phan_he "KHO_NL, SAN_XUAT, KHO_BTP"
        enum loai_giao_dich "NHAP, XUAT"
        varchar ten_danh_muc
        boolean la_he_thong
    }
    
    lo_giao_dich {
        uuid id PK
        varchar ma_lo "Mã tracking barcode"
        uuid id_tai_khoan FK
        uuid id_danh_muc FK
        uuid id_cong_hang FK "Null nếu không phải xuất cho SX"
        jsonb danh_sach_anh "Mảng URL ảnh từ Cloudinary"
        jsonb danh_sach_don_tong "Mảng cấp phát: [{id_don_tong_chi_tiet, so_luong}]"
        datetime ngay_tao
    }

    so_cai_vat_tu {
        uuid id PK
        uuid id_lo_giao_dich FK
        uuid id_nguyen_lieu FK
        varchar ma_quy_cach "Bóc tách từ nguyên liệu"
        numeric bien_dong_so_luong "Dương: Nhập, Âm: Xuất"
        numeric ton_kho_hien_tai "SỐ DƯ CUỐI CÙNG (Snapshot O(1))"
        datetime created_at
    }
    
    don_tong {
        uuid id PK
        varchar ma_don_tong
        varchar trang_thai "CHUA_DU, DA_DU"
        varchar ten_don
        text ghi_chu
    }
    
    don_tong_chi_tiet {
        uuid id PK
        uuid id_don_tong FK
        uuid id_nguyen_lieu FK
        varchar ma_quy_cach
        numeric so_luong_yeu_cau
        numeric so_luong_da_nhap
    }
    
    cong_hang {
        uuid id PK
        varchar ma_cong_hang
        enum trang_thai_sx "CHUA_LAM, DANG_LAM, DA_LAM"
        enum trang_thai_kho "CHUA_NHAP, TON_KHO, DA_GIAO"
        jsonb danh_sach_cong_doan "Mảng: [{id_cong_doan, id_cong_nhan, da_xong}]"
    }

    don_hang {
        uuid id PK
        uuid id_cong_hang FK
        varchar ma_don_hang
        varchar ma_hang
        numeric so_luong_san_xuat
    }
    
    cong_nhan {
        uuid id PK
        varchar ma_cong_nhan
        varchar ho_ten
        varchar vai_tro
    }

    cong_doan {
        uuid id PK
        varchar ten_cong_doan
    }
```

---

## 2. Giải thích Sự phối hợp Dữ liệu (Module Coordination)

Cơ sở dữ liệu được thiết kế theo tư tưởng "Sổ cái" (Ledger-based) kết hợp với lưu trữ phi cấu trúc một phần (JSONB) để tối ưu truy xuất.

### Nhóm 1: Nhóm Dữ liệu Kho Nguyên Liệu (`nguyen_lieu`, `danh_muc_giao_dich`, `lo_giao_dich`, `so_cai_vat_tu`)
- **Nguyên lý hoạt động:** Bất cứ khi nào vật tư di chuyển ra/vào kho, một `lo_giao_dich` (Đại diện cho Phiếu nhập/xuất) được tạo ra. Kèm theo đó, hệ thống chèn (INSERT) các dòng vào `so_cai_vat_tu` tương ứng với từng vật tư trong lô.
- **Tính năng Chốt sổ (Snapshot):** Cột `ton_kho_hien_tai` trong bảng Sổ cái lưu lại số dư tồn kho **ngay tại thời điểm giao dịch hoàn tất**. Nhờ vậy, ta không bao giờ phải chạy lệnh `SUM()` toàn bộ lịch sử để tìm tồn kho hiện tại.
- View PostgreSQL `view_ton_kho_hien_tai` chỉ cần lấy dòng Sổ cái có `created_at` mới nhất bằng lệnh `DISTINCT ON (id_nguyen_lieu, ma_quy_cach)`, mang lại **độ phức tạp O(1)** không đổi bất chấp số lượng giao dịch tăng lên hàng triệu dòng.

### Nhóm 2: Nhóm Dữ liệu Đơn Tổng (`don_tong`, `don_tong_chi_tiet`)
- **Vai trò:** Lên danh sách định mức vật tư dự kiến cho một chiến dịch sản xuất.
- **Phối hợp cấp phát vật tư:** 
  - Thay vì tạo một bảng n-n riêng lẻ, hệ thống sử dụng trường `danh_sach_don_tong (JSONB)` trực tiếp bên trong bảng `lo_giao_dich`.
  - **Khi người dùng Cấp phát (Allocate):** Lô giao dịch gốc sẽ được cập nhật trường JSONB này để ghi nhận: *"Lô này đã trích ra N kg vật tư để đưa vào id_don_tong_chi_tiet tương ứng"*.
  - **Tính Tồn chưa phân:** `so_luong` của Lô trừ đi tổng các giá trị trong mảng JSONB `danh_sach_don_tong`.
  - Cột `so_luong_da_nhap` trong `don_tong_chi_tiet` tự động tăng/giảm dựa trên các lần cấp phát/rút trả. Từ đó Đơn tổng tự động cập nhật trạng thái `DA_DU` khi nhập >= yêu cầu.

### Nhóm 3: Nhóm Sản xuất & Bán Thành Phẩm (`cong_hang`, `don_hang`, `cong_doan`, `cong_nhan`)
- **Mối liên hệ vòng đời:** Một công hàng có thể phục vụ nhiều đơn hàng (1 Công hàng - N Đơn hàng thông qua bảng `don_hang`).
- **Phối hợp theo dõi tiến độ:** 
  - Thay vì thiết kế bảng n-n rườm rà cho quy trình sản xuất (bởi vì các công đoạn sản xuất như cưa, bào, sơn... có tính thứ tự và linh hoạt cao), hệ thống áp dụng trường `danh_sach_cong_doan (JSONB)` trong `cong_hang`.
  - Trong mảng JSON này, nó lưu trữ ai (id_cong_nhan) làm bước nào (id_cong_doan) và trạng thái (da_xong).
  - Khi cần Xuất kho nguyên liệu xuống cho một công hàng sản xuất, `lo_giao_dich` sẽ mang giá trị `id_cong_hang` để kế toán dễ dàng truy vết vật tư này đang nằm ở công hàng nào.
