# Sơ đồ Cơ sở dữ liệu và Mô hình Phối hợp (Database Schema)

Tài liệu này giải thích chi tiết cấu trúc các bảng (Tables) hiện tại trên môi trường Production, các quan hệ (Relationships), và cách chúng phối hợp thành các nhóm (Groups) để giải quyết bài toán nghiệp vụ lõi (Kho, Đơn Tổng, Sản xuất).

---

## 1. Sơ đồ Quan hệ Thực thể (ERD Toàn Hệ Thống)

Sơ đồ dưới đây thể hiện toàn bộ **12 bảng** hiện có trong hệ thống và các mối liên kết.

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
    
    %% Bảng trung gian cấp phát
    so_cai_vat_tu ||--o{ chi_tiet_cap_phat : "Cho phép cấp phát"
    don_tong_chi_tiet ||--o{ chi_tiet_cap_phat : "Nhận cấp phát"
    
    cong_hang ||--o{ don_hang : "Sản xuất cho (1-N)"
    cong_hang ||--o{ lo_giao_dich : "Phiếu xuất kho cho SX"

    %% ==========================================
    %% ĐỊNH NGHĨA CÁC BẢNG (ENTITIES)
    %% ==========================================
    tai_khoan {
        uuid id PK
        varchar tai_khoan "Tên đăng nhập"
        varchar mat_khau
        varchar vai_tro
        varchar ho_ten
        boolean dang_hoat_dong
        varchar anh_dai_dien
    }
    
    nguyen_lieu {
        uuid id PK
        varchar ten_nguyen_lieu
        varchar don_vi
        jsonb danh_sach_quy_cach
        text anh_minh_hoa
    }

    danh_muc_giao_dich {
        uuid id PK
        enum phan_he
        enum loai_giao_dich
        varchar ten_danh_muc
        boolean la_he_thong
        boolean dang_hoat_dong
    }
    
    lo_giao_dich {
        uuid id PK
        varchar ma_lo "Mã tracking barcode"
        uuid id_tai_khoan FK
        uuid id_danh_muc FK
        uuid id_cong_hang FK
        jsonb danh_sach_anh
        datetime ngay_tao
        text ghi_chu
    }

    so_cai_vat_tu {
        uuid id PK
        uuid id_lo_giao_dich FK
        uuid id_nguyen_lieu FK
        varchar ma_quy_cach
        numeric bien_dong_so_luong
        numeric ton_kho_hien_tai "SỐ DƯ CUỐI CÙNG (Snapshot)"
    }
    
    don_tong {
        uuid id PK
        varchar ma_don_tong
        varchar ten_don
        varchar trang_thai "CHUA_DU, DA_DU"
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
    
    chi_tiet_cap_phat {
        uuid id PK
        uuid id_so_cai_vat_tu FK
        uuid id_don_tong_chi_tiet FK
        numeric so_luong_cap_phat
    }
    
    cong_hang {
        uuid id PK
        varchar ma_cong_hang
        enum trang_thai_sx "CHUA_LAM, DANG_LAM, DA_LAM"
        enum trang_thai_kho "CHUA_NHAP, TON_KHO, DA_GIAO"
        jsonb danh_sach_cong_doan
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
        varchar so_dien_thoai
        varchar vai_tro
    }

    cong_doan {
        uuid id PK
        varchar ten_cong_doan
    }
```

---

## 2. Giải thích Sự phối hợp Dữ liệu (Module Coordination)

Cơ sở dữ liệu được thiết kế theo tư tưởng **Sổ cái (Ledger-based)** chuẩn mực, tách bạch hoàn toàn việc lưu trữ biến động kho và việc phân bổ cho chiến dịch sản xuất.

### Nhóm 1: Nhóm Dữ liệu Kho Nguyên Liệu (`nguyen_lieu`, `danh_muc_giao_dich`, `lo_giao_dich`, `so_cai_vat_tu`)
- **Nguyên lý hoạt động:** Bất cứ khi nào vật tư di chuyển ra/vào kho, một `lo_giao_dich` (Đại diện cho Phiếu nhập/xuất) được tạo ra. Kèm theo đó, hệ thống chèn (INSERT) các dòng vào `so_cai_vat_tu` tương ứng với từng vật tư trong lô.
- **Tính năng Chốt sổ (Snapshot):** Cột `ton_kho_hien_tai` trong bảng Sổ cái lưu lại số dư tồn kho **ngay tại thời điểm giao dịch hoàn tất**. Nhờ vậy, ta không bao giờ phải chạy lệnh `SUM()` toàn bộ lịch sử để tìm tồn kho hiện tại.

### Nhóm 2: Nhóm Dữ liệu Đơn Tổng & Cấp Phát (`don_tong`, `don_tong_chi_tiet`, `chi_tiet_cap_phat`)
- **Vai trò:** Lên danh sách định mức vật tư dự kiến cho một chiến dịch sản xuất (`don_tong_chi_tiet`).
- **Phối hợp cấp phát vật tư qua `chi_tiet_cap_phat`:** 
  - Hệ thống sử dụng một bảng trung gian chuẩn hóa `chi_tiet_cap_phat`. Bảng này làm cầu nối trực tiếp giữa **1 dòng sổ cái** (`id_so_cai_vat_tu`) và **1 yêu cầu vật tư** (`id_don_tong_chi_tiet`).
  - **Khi Cấp phát (Allocate):** Khi người dùng muốn rót vật tư, họ thực chất đang trích xuất từ một Lô cụ thể (tức là một dòng trong `so_cai_vat_tu`). Hệ thống ghi nhận số lượng trích xuất vào `so_luong_cap_phat`.
  - **Tính Tồn chưa phân:** Số lượng Tồn chưa phân của một dòng sổ cái bằng `bien_dong_so_luong` của nó trừ đi `SUM(so_luong_cap_phat)` trong bảng `chi_tiet_cap_phat` trỏ đến nó.
  - Cột `so_luong_da_nhap` trong `don_tong_chi_tiet` tự động phản ánh tổng số vật tư đã được cấp phát vào đó, giúp kiểm soát trạng thái Đơn tổng (`CHUA_DU` / `DA_DU`).

### Nhóm 3: Nhóm Sản xuất & Bán Thành Phẩm (`cong_hang`, `don_hang`, `cong_doan`, `cong_nhan`)
- **Mối liên hệ vòng đời:** Một công hàng có thể phục vụ nhiều đơn hàng (1 Công hàng - N Đơn hàng thông qua bảng `don_hang`).
- **Phối hợp theo dõi tiến độ:** 
  - Các công đoạn sản xuất như cưa, bào, sơn... có tính thứ tự và linh hoạt cao, do đó hệ thống áp dụng trường `danh_sach_cong_doan (JSONB)` trong `cong_hang`.
  - Trong mảng JSON này lưu trữ ai (`id_cong_nhan`) làm bước nào (`id_cong_doan`) và trạng thái (`da_xong`).
  - Khi xuất kho nguyên liệu để tiến hành sản xuất, `lo_giao_dich` mang giá trị `id_cong_hang` để kế toán truy vết được lượng vật tư này đã đổ vào công hàng nào.
