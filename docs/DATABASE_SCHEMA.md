# Thiết kế Cơ sở Dữ liệu (Database Architecture)

Tài liệu này chứa cấu trúc CSDL để chúng ta cùng thảo luận, chỉnh sửa trước khi chốt kiến trúc cuối cùng.

## 1. Nguyên tắc thiết kế (Ledger-based & JSONB)
Thiết kế Sổ cái (Ledger) kết hợp lưu trữ số dư tồn kho tức thời sẽ áp dụng cho Kho Nguyên liệu. Đối với Bán thành phẩm và Quản lý Sản xuất, hệ thống tận dụng tối đa sức mạnh NoSQL của Postgres (cột JSONB) để gộp các bảng quan hệ phức tạp thành các mảng linh hoạt, giúp tốc độ truy xuất cực nhanh. Việc kiểm soát trạng thái được tiêu chuẩn hóa bằng các cấu trúc **ENUM**.

---

## 2. Sơ đồ Quan hệ Thực thể (ERD - Tiếng Việt Không Dấu)

```mermaid
erDiagram
    %% ==========================================
    %% 1. TÀI KHOẢN (Đăng nhập)
    %% ==========================================
    tai_khoan {
        uuid id PK
        string so_dien_thoai "Dùng để đăng nhập"
        string mat_khau
        string vai_tro "Quan ly / Nhan vien"
        string ho_ten
        boolean dang_hoat_dong
    }

    %% ==========================================
    %% 2. KHO NGUYÊN LIỆU (JSONB Quy cách)
    %% ==========================================
    nguyen_lieu {
        uuid id PK
        string ten_nguyen_lieu "Ví dụ: Gỗ sồi, Gỗ xoan"
        string don_vi "Ví dụ: Khối, Tấm"
        jsonb danh_sach_quy_cach "VD: [{ma_quy_cach: '2x4', ten: '2x4 inch'}]"
    }

    %% ==========================================
    %% 3. QUẢN LÝ CÔNG NHÂN SẢN XUẤT
    %% ==========================================
    cong_nhan {
        uuid id PK
        string ma_cong_nhan "VD: CN001"
        string ho_ten
        string so_dien_thoai
        string vai_tro "VD: Thợ mộc, Thợ sơn"
        string ghi_chu
    }

    %% ==========================================
    %% 4. DANH MỤC CÔNG ĐOẠN SẢN XUẤT
    %% ==========================================
    cong_doan {
        uuid id PK
        string ten_cong_doan "Ví dụ: Cưa, Bào, Sơn"
        string ghi_chu
    }

    %% ==========================================
    %% 5. SẢN XUẤT & BÁN THÀNH PHẨM (Gộp Công đoạn bằng JSONB)
    %% ==========================================
    cong_hang {
        uuid id PK
        string ma_cong_hang "VD: 26V009-..."
        enum_trang_thai_sx trang_thai_sx "CHUA_LAM, DANG_LAM, DA_LAM"
        enum_trang_thai_kho trang_thai_kho "CHUA_NHAP, TON_KHO, DA_GIAO"
        jsonb danh_sach_cong_doan "Mảng lưu: id_cong_doan, da_xong, id_cong_nhan, Ngày cập nhật"
        string ghi_chu
        timestamp ngay_tao
        timestamp ngay_hoan_thanh
    }
    don_hang {
        uuid id PK
        uuid id_cong_hang FK
        string ma_don_hang "VD: 1708331BRO"
        string ma_hang "Mã hàng hóa BTP"
        numeric so_luong_san_xuat
    }

    %% ==========================================
    %% 6. GIAO DỊCH CHUNG & ẢNH MINH CHỨNG (Gộp JSONB)
    %% ==========================================
    danh_muc_giao_dich {
        uuid id PK
        enum_phan_he phan_he "NGUYEN_LIEU, BAN_THANH_PHAM"
        enum_loai_giao_dich loai_giao_dich "NHAP, XUAT, CHINH_SUA"
        string ten_danh_muc "Lý do (Nhập đổi, Xuất bù...)"
        boolean la_he_thong "Tự động/Cố định không cho sửa"
        string ghi_chu
    }
    %% Lô giao dịch (Chứa mảng JSONB ảnh đính kèm)
    lo_giao_dich {
        uuid id PK
        string ma_lo "Mã chứng từ"
        uuid id_tai_khoan FK
        uuid id_danh_muc FK
        uuid id_cong_hang FK "Dùng khi cấp phát hoặc xuất giao BTP"
        jsonb danh_sach_anh "Mảng URL ảnh minh chứng (Gộp bảng)"
        timestamp ngay_tao
        string ghi_chu
    }
    
    %% ==========================================
    %% 7. SỔ CÁI (KẾ TOÁN NGUYÊN LIỆU)
    %% ==========================================
    so_cai_vat_tu {
        uuid id PK
        uuid id_lo_giao_dich FK
        uuid id_nguyen_lieu FK
        string ma_quy_cach "Chuỗi map với JSONB"
        numeric bien_dong_so_luong "Dương (+): Nhập, Âm (-): Xuất"
        numeric ton_kho_hien_tai "Tồn kho SAU KHI biến động"
    }

    %% Mối quan hệ logic
    tai_khoan ||--o{ lo_giao_dich : "tao"
    cong_hang ||--o{ don_hang : "chua"
    danh_muc_giao_dich ||--o{ lo_giao_dich : "phan_loai"
    lo_giao_dich ||--o{ so_cai_vat_tu : "ghi_nhan_vat_tu"
    nguyen_lieu ||--o{ so_cai_vat_tu : "chua_thong_tin"
    cong_hang ||--o{ lo_giao_dich : "tham_chieu"
    cong_nhan ||--o{ cong_hang : "phan_cong_qua_jsonb"
    cong_doan ||--o{ cong_hang : "tham_chieu_qua_jsonb"
```

---

## 3. Thảo luận & Open Questions (Dành cho bạn)

Kiến trúc Database này tập trung giải quyết:
- **Gộp giao dịch (Batch):** Một phiếu giao dịch (`lo_giao_dich`) đính kèm ảnh bằng JSONB, nhập/xuất n-quy cách nguyên liệu.
- **Tối giản Hóa Sản xuất:** Mảng `danh_sach_cong_doan` (JSONB) trong bảng Công hàng sẽ lưu trữ trực tiếp các liên kết (ID) tới bảng `cong_nhan` và `cong_doan` để theo dõi tiến độ một cách linh hoạt mà không cần tạo bảng trung gian khổng lồ.
- **Truy vết Kế toán:** Bảng `so_cai_vat_tu` ghi nhận sự tăng/giảm (+/-) và số dư tồn kho tại chính thời điểm đó.

**(Tất cả câu hỏi thảo luận đã được giải quyết!)**
