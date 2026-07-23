-- Khởi tạo extension để tự động sinh UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- KHỞI TẠO CÁC KIỂU DỮ LIỆU ENUM
-- ==========================================
CREATE TYPE enum_trang_thai_sx AS ENUM ('CHUA_LAM', 'DANG_LAM', 'DA_LAM');
CREATE TYPE enum_trang_thai_kho AS ENUM ('CHUA_NHAP', 'TON_KHO', 'DA_GIAO');
CREATE TYPE enum_phan_he AS ENUM ('NGUYEN_LIEU', 'BAN_THANH_PHAM');
CREATE TYPE enum_loai_giao_dich AS ENUM ('NHAP', 'XUAT', 'CHINH_SUA');

-- ==========================================
-- 1. BẢNG TÀI KHOẢN (Đăng nhập hệ thống)
-- ==========================================
CREATE TABLE tai_khoan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_dien_thoai VARCHAR(20) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    vai_tro VARCHAR(50) NOT NULL, -- VD: 'Quan ly', 'Nhan vien'
    ho_ten VARCHAR(255) NOT NULL,
    dang_hoat_dong BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. KHO NGUYÊN LIỆU
-- ==========================================
CREATE TABLE nguyen_lieu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_nguyen_lieu VARCHAR(255) NOT NULL,
    don_vi VARCHAR(50) NOT NULL,
    danh_sach_quy_cach JSONB DEFAULT '[]'::jsonb, -- VD: [{"ma_quy_cach": "2x4", "ten": "2x4 inch"}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. QUẢN LÝ CÔNG NHÂN SẢN XUẤT
-- ==========================================
CREATE TABLE cong_nhan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ma_cong_nhan VARCHAR(50) UNIQUE NOT NULL, -- VD: CN-001
    ho_ten VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20),
    vai_tro VARCHAR(100), -- VD: Thợ mộc, Thợ sơn, Lắp ráp
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. DANH MỤC CÔNG ĐOẠN SẢN XUẤT
-- ==========================================
CREATE TABLE cong_doan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten_cong_doan VARCHAR(255) NOT NULL, -- VD: Cưa, Bào, Sơn
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. SẢN XUẤT & KHO BÁN THÀNH PHẨM
-- ==========================================
CREATE TABLE cong_hang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ma_cong_hang VARCHAR(100) UNIQUE NOT NULL,
    trang_thai_sx enum_trang_thai_sx DEFAULT 'CHUA_LAM',
    trang_thai_kho enum_trang_thai_kho DEFAULT 'CHUA_NHAP',
    -- JSONB mảng công đoạn. VD: [{"id_cong_doan": "uuid...", "id_cong_nhan": "uuid...", "da_xong": true, "ngay_cap_nhat": "..."}]
    danh_sach_cong_doan JSONB DEFAULT '[]'::jsonb, 
    ghi_chu TEXT,
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ngay_hoan_thanh TIMESTAMP WITH TIME ZONE
);

CREATE TABLE don_hang (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cong_hang UUID REFERENCES cong_hang(id) ON DELETE CASCADE,
    ma_don_hang VARCHAR(100) NOT NULL,
    ma_hang VARCHAR(100) NOT NULL,
    so_luong_san_xuat NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. GIAO DỊCH CHUNG & ẢNH MINH CHỨNG
-- ==========================================
CREATE TABLE danh_muc_giao_dich (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phan_he enum_phan_he NOT NULL,
    loai_giao_dich enum_loai_giao_dich NOT NULL,
    ten_danh_muc VARCHAR(255) NOT NULL,
    la_he_thong BOOLEAN DEFAULT FALSE,
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lo_giao_dich (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ma_lo VARCHAR(100) UNIQUE NOT NULL,
    id_tai_khoan UUID REFERENCES tai_khoan(id),
    id_danh_muc UUID REFERENCES danh_muc_giao_dich(id),
    id_cong_hang UUID REFERENCES cong_hang(id) ON DELETE SET NULL, -- Nullable (Dùng khi xuất kho SX)
    danh_sach_anh JSONB DEFAULT '[]'::jsonb, -- Chứa mảng link ảnh từ Cloudinary
    ngay_tao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ghi_chu TEXT
);

-- ==========================================
-- 7. SỔ CÁI KẾ TOÁN (NGUYÊN LIỆU)
-- ==========================================
CREATE TABLE so_cai_vat_tu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_lo_giao_dich UUID REFERENCES lo_giao_dich(id) ON DELETE CASCADE,
    id_nguyen_lieu UUID REFERENCES nguyen_lieu(id),
    ma_quy_cach VARCHAR(100) NOT NULL,
    bien_dong_so_luong NUMERIC NOT NULL, -- Dương: Nhập, Âm: Xuất
    ton_kho_hien_tai NUMERIC NOT NULL, -- Số dư tồn kho ngay sau biến động
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TỐI ƯU HÓA HIỆU SUẤT (INDEXING)
-- ==========================================
-- Tối ưu hóa truy vấn trên các trường JSONB bằng GIN index
CREATE INDEX idx_nguyen_lieu_quy_cach ON nguyen_lieu USING gin (danh_sach_quy_cach);
CREATE INDEX idx_cong_hang_cong_doan ON cong_hang USING gin (danh_sach_cong_doan);
CREATE INDEX idx_lo_giao_dich_anh ON lo_giao_dich USING gin (danh_sach_anh);

-- Tối ưu hóa truy vấn khóa ngoại và ngày tháng thường dùng
CREATE INDEX idx_so_cai_vat_tu_nguyen_lieu ON so_cai_vat_tu(id_nguyen_lieu);
CREATE INDEX idx_so_cai_vat_tu_ngay ON so_cai_vat_tu(created_at);
CREATE INDEX idx_lo_giao_dich_ngay ON lo_giao_dich(ngay_tao);
