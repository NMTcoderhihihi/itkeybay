-- ==========================================
-- FILE: docs/init_supabase.sql
-- ==========================================

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
    tai_khoan VARCHAR(100) UNIQUE NOT NULL,
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


-- ==========================================
-- FILE: docs/migration_btp.sql
-- ==========================================

-- ====================================================================
-- SCRIPT MIGRATION & RESET DỮ LIỆU CÔNG HÀNG / BÁN THÀNH PHẨM (BTP)
-- ====================================================================

-- --------------------------------------------------------------------
-- PHẦN 1: RESET DỮ LIỆU TEST (CÔNG HÀNG & ĐƠN HÀNG HIỆN TẠI)
-- [CẢNH BÁO: XÓA SẠCH DỮ LIỆU CÔNG HÀNG VÀ CÁC GIAO DỊCH KHO LIÊN QUAN]
-- --------------------------------------------------------------------

-- 1.1 Xóa sổ cái vật tư liên quan đến các lô giao dịch gắn với công hàng (phát liệu, hoàn thành...)
DELETE FROM public.so_cai_vat_tu 
WHERE id_lo_giao_dich IN (
    SELECT id FROM public.lo_giao_dich WHERE id_cong_hang IS NOT NULL
);

-- 1.2 Xóa các lô giao dịch gắn với công hàng
DELETE FROM public.lo_giao_dich WHERE id_cong_hang IS NOT NULL;

-- 1.3 Xóa đơn hàng và công hàng
DELETE FROM public.don_hang;
DELETE FROM public.cong_hang;

-- --------------------------------------------------------------------
-- PHẦN 2: CHUẨN HÓA CẤU TRÚC & THÊM DANH MỤC GIAO DỊCH BÁN THÀNH PHẨM
-- --------------------------------------------------------------------

-- 2.1 Xóa cột danh_sach_anh_hoan_thanh trong bảng cong_hang (nếu tồn tại)
ALTER TABLE public.cong_hang DROP COLUMN IF EXISTS danh_sach_anh_hoan_thanh;

-- 2.2 Thêm danh mục giao dịch HỆ THỐNG (Mặc định tự động khi Hoàn thành công hàng -> Nhập kho BTP)
INSERT INTO public.danh_muc_giao_dich (phan_he, loai_giao_dich, ten_danh_muc, la_he_thong, ghi_chu, dang_hoat_dong)
SELECT 'BAN_THANH_PHAM', 'NHAP', 'Hoàn thành sản xuất (Nhập kho BTP)', TRUE, 'Danh mục tự động của hệ thống khi nhập BTP từ công hàng hoàn thành', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.danh_muc_giao_dich 
    WHERE ten_danh_muc = 'Hoàn thành sản xuất (Nhập kho BTP)' AND phan_he = 'BAN_THANH_PHAM'
);

-- 2.3 Thêm danh mục giao dịch thông thường: Xuất bán thành phẩm (Giao hàng)
INSERT INTO public.danh_muc_giao_dich (phan_he, loai_giao_dich, ten_danh_muc, la_he_thong, ghi_chu, dang_hoat_dong)
SELECT 'BAN_THANH_PHAM', 'XUAT', 'Xuất bán thành phẩm (Giao hàng)', FALSE, 'Danh mục xuất bán thành phẩm cho đối tượng bán thành phẩm', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.danh_muc_giao_dich 
    WHERE ten_danh_muc = 'Xuất bán thành phẩm (Giao hàng)' AND phan_he = 'BAN_THANH_PHAM'
);


-- ==========================================
-- FILE: docs/migration_don_tong.sql
-- ==========================================

-- Tạo bảng Quản lý Đơn tổng (Master Order)
CREATE TABLE public.don_tong (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ma_don_tong character varying NOT NULL,
  ten_don character varying,
  ghi_chu text,
  trang_thai character varying DEFAULT 'CHUA_DU'::character varying, -- CHUA_DU, DA_DU
  ngay_tao timestamp with time zone DEFAULT now(),
  CONSTRAINT don_tong_pkey PRIMARY KEY (id),
  CONSTRAINT don_tong_ma_don_tong_key UNIQUE (ma_don_tong)
);

-- Bật Realtime cho bảng don_tong
alter publication supabase_realtime add table public.don_tong;

-- Tạo bảng Chi tiết Vật tư yêu cầu cho Đơn tổng
CREATE TABLE public.don_tong_chi_tiet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_don_tong uuid NOT NULL,
  id_nguyen_lieu uuid NOT NULL,
  ma_quy_cach character varying NOT NULL,
  so_luong_yeu_cau numeric NOT NULL DEFAULT 0,
  so_luong_da_nhap numeric NOT NULL DEFAULT 0,
  CONSTRAINT don_tong_chi_tiet_pkey PRIMARY KEY (id),
  CONSTRAINT don_tong_chi_tiet_id_don_tong_fkey FOREIGN KEY (id_don_tong) REFERENCES public.don_tong(id) ON DELETE CASCADE,
  CONSTRAINT don_tong_chi_tiet_id_nguyen_lieu_fkey FOREIGN KEY (id_nguyen_lieu) REFERENCES public.nguyen_lieu(id) ON DELETE CASCADE,
  CONSTRAINT don_tong_chi_tiet_unique UNIQUE (id_don_tong, id_nguyen_lieu, ma_quy_cach)
);

-- Bật Realtime cho bảng don_tong_chi_tiet
alter publication supabase_realtime add table public.don_tong_chi_tiet;

-- Thêm cột danh_sach_don_tong (lưu trữ JSON mảng các id_don_tong) vào bảng lo_giao_dich
ALTER TABLE public.lo_giao_dich ADD COLUMN IF NOT EXISTS danh_sach_don_tong jsonb;

-- (Tùy chọn) Cấp quyền truy cập nếu bật RLS, mặc định dự án này nếu không dùng RLS thì không cần chạy các dòng này
-- ALTER TABLE public.don_tong ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Bật tất cả quyền cho don_tong" ON public.don_tong FOR ALL USING (true);
-- ALTER TABLE public.don_tong_chi_tiet ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Bật tất cả quyền cho don_tong_chi_tiet" ON public.don_tong_chi_tiet FOR ALL USING (true);


-- ==========================================
-- FILE: docs/migration_quy_cach.sql
-- ==========================================

-- ====================================================================
-- SCRIPT MIGRATION & BẢO TOÀN DỮ LIỆU: CHUẨN HÓA MÃ QUY CÁCH VẬT TƯ
-- ====================================================================
-- Mục đích:
-- 1. Đọc toàn bộ các mã quy cách trước đó (`old_code`) trong bảng `nguyen_lieu`.
-- 2. Tự động quét cấu trúc CSDL (`information_schema.columns`) để tìm kiếm
--    trong Sổ cái (`so_cai_vat_tu`) và tất cả các bảng/nơi khác có sử dụng
--    hoặc tham chiếu đến cột `ma_quy_cach`.
-- 3. Cập nhật đồng bộ tham chiếu từ Mã cũ sang Mã mới chuẩn hóa (`QC-01`, `QC-02`...)
--    để tránh làm hỏng hoặc sai lệch số liệu lịch sử đã có.
-- 4. Chuẩn hóa mảng JSONB `danh_sach_quy_cach` trong `nguyen_lieu`.
-- ====================================================================

DO $$
DECLARE
    nl RECORD;
    qc JSONB;
    tbl RECORD;
    idx INT;
    old_code TEXT;
    new_code TEXT;
    new_danh_sach JSONB;
    total_materials INT := 0;
    total_refs_updated INT := 0;
    rows_affected INT := 0;
    has_nguyen_lieu_col BOOLEAN;
    sql_query TEXT;
BEGIN
    RAISE NOTICE '=== BẮT ĐẦU CHUẨN HÓA MÃ QUY CÁCH VẬT TƯ & CẬP NHẬT THAM CHIẾU TOÀN DIỆN ===';

    -- Lặp qua từng vật tư (nguyen_lieu) có danh sách quy cách
    FOR nl IN 
        SELECT id, ten_nguyen_lieu, danh_sach_quy_cach 
        FROM public.nguyen_lieu 
        WHERE danh_sach_quy_cach IS NOT NULL 
          AND jsonb_typeof(danh_sach_quy_cach) = 'array' 
          AND jsonb_array_length(danh_sach_quy_cach) > 0 
    LOOP
        new_danh_sach := '[]'::jsonb;
        idx := 1;

        FOR qc IN SELECT * FROM jsonb_array_elements(nl.danh_sach_quy_cach) LOOP
            old_code := qc->>'ma_quy_cach';
            -- Tạo mã mới chuẩn hóa: QC-01, QC-02, ...
            new_code := 'QC-' || LPAD(idx::text, 2, '0');

            -- 1. Tìm kiếm và thay đổi tham chiếu trong SỔ CÁI và TẤT CẢ CÁC BẢNG KHÁC
            --    có sử dụng cột ma_quy_cach trong schema public (trừ bảng nguyen_lieu)
            IF old_code IS NOT NULL AND old_code <> '' AND old_code <> new_code THEN
                FOR tbl IN 
                    SELECT table_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                      AND column_name = 'ma_quy_cach'
                      AND table_name <> 'nguyen_lieu'
                LOOP
                    -- Kiểm tra xem bảng có cột id_nguyen_lieu để lọc chính xác không
                    SELECT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                          AND table_name = tbl.table_name 
                          AND column_name = 'id_nguyen_lieu'
                    ) INTO has_nguyen_lieu_col;

                    IF has_nguyen_lieu_col THEN
                        sql_query := format(
                            'UPDATE public.%I SET ma_quy_cach = $1 WHERE ma_quy_cach = $2 AND id_nguyen_lieu = $3',
                            tbl.table_name
                        );
                        EXECUTE sql_query USING new_code, old_code, nl.id;
                    ELSE
                        sql_query := format(
                            'UPDATE public.%I SET ma_quy_cach = $1 WHERE ma_quy_cach = $2',
                            tbl.table_name
                        );
                        EXECUTE sql_query USING new_code, old_code;
                    END IF;

                    GET DIAGNOSTICS rows_affected = ROW_COUNT;
                    total_refs_updated := total_refs_updated + rows_affected;

                    IF rows_affected > 0 THEN
                        RAISE NOTICE 'Bảng [%] - Vật tư [%]: Đã cập nhật % bản ghi từ [%] -> [%]',
                            tbl.table_name, nl.ten_nguyen_lieu, rows_affected, old_code, new_code;
                    END IF;
                END LOOP;
            END IF;

            -- 2. Thêm quy cách vào danh sách chuẩn hóa với mã QC-XX mới
            new_danh_sach := new_danh_sach || jsonb_build_object(
                'ma_quy_cach', new_code,
                'ten', COALESCE(qc->>'ten', 'Quy cách ' || idx::text)
            );

            idx := idx + 1;
        END LOOP;

        -- 3. Cập nhật lại danh_sach_quy_cach chuẩn hóa vào bảng nguyen_lieu
        UPDATE public.nguyen_lieu 
        SET danh_sach_quy_cach = new_danh_sach 
        WHERE id = nl.id;

        total_materials := total_materials + 1;
    END LOOP;

    RAISE NOTICE '=== HOÀN TẤT CHUẨN HÓA ===';
    RAISE NOTICE 'Tổng số vật tư đã chuyển đổi mã quy cách: %', total_materials;
    RAISE NOTICE 'Tổng số bản ghi tham chiếu ở các bảng đã được bảo toàn & đồng bộ mã: %', total_refs_updated;
END $$;


-- ==========================================
-- FILE: docs/migration_product_to_dev_v1_20260726.sql
-- ==========================================

-- =========================================================================================
-- SCRIPT MIGRATE TỔNG: NÂNG CẤP DATABASE PRODUCTION LÊN CHUẨN DEV (ITKEYBAY)
-- Phiên bản: v1
-- Ngày lập: 26/07/2026
-- Mục tiêu: 
--   1. Chuẩn hóa bảng tai_khoan (đổi tên cột so_dien_thoai -> tai_khoan).
--   2. Tự động hóa gán mã quy cách (QC-01, QC-02...) cho toàn bộ vật tư trong nguyen_lieu.
--   3. Đồng bộ và bảo toàn 100% liên kết mã quy cách trong bảng so_cai_vat_tu.
--   4. Đảm bảo toàn thể cấu trúc Production đồng nhất 100% với cấu trúc Dev hiện hành.
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- BƯỚC 1: CHUẨN HÓA BẢNG TÀI KHOẢN (so_dien_thoai -> tai_khoan)
-- -----------------------------------------------------------------------------------------
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tai_khoan' 
      AND column_name = 'so_dien_thoai'
  ) THEN
    ALTER TABLE public.tai_khoan RENAME COLUMN so_dien_thoai TO tai_khoan;
    RAISE NOTICE 'Đã đổi tên cột so_dien_thoai thành tai_khoan trong bảng public.tai_khoan.';
  ELSE
    RAISE NOTICE 'Cột tai_khoan đã tồn tại hoặc đã được đổi tên trước đó.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------------------
-- BƯỚC 2: TẠO BẢNG TẠM LƯU ÁNH XẠ MÃ QUY CÁCH (CŨ -> MỚI)
-- -----------------------------------------------------------------------------------------
CREATE TEMP TABLE temp_quy_cach_map (
  id_nguyen_lieu UUID,
  ma_cu TEXT,
  ma_moi TEXT,
  ten TEXT,
  min_stock NUMERIC,
  so_thu_tu INT
);

-- Bóc tách quy cách hiện tại trong JSONB và gán số thứ tự tuần tự theo từng nguyên liệu
INSERT INTO temp_quy_cach_map (id_nguyen_lieu, ma_cu, ten, min_stock, so_thu_tu)
SELECT 
  nl.id AS id_nguyen_lieu,
  item->>'ma_quy_cach' AS ma_cu,
  item->>'ten' AS ten,
  COALESCE((item->>'min_stock')::numeric, 0) AS min_stock,
  ROW_NUMBER() OVER (PARTITION BY nl.id ORDER BY (SELECT NULL)) AS so_thu_tu
FROM public.nguyen_lieu nl,
LATERAL jsonb_array_elements(COALESCE(nl.danh_sach_quy_cach, '[]'::jsonb)) AS item
WHERE item->>'ma_quy_cach' IS NOT NULL;

-- Sinh mã quy cách chuẩn theo định dạng QC-01, QC-02, QC-03...
UPDATE temp_quy_cach_map
SET ma_moi = 'QC-' || LPAD(so_thu_tu::text, 2, '0');

-- -----------------------------------------------------------------------------------------
-- BƯỚC 3: ĐỒNG BỘ MÃ QUY CÁCH TRONG SỔ CÁI VẬT TƯ (BẢO TOÀN LỊCH SỬ & TỒN KHO)
-- -----------------------------------------------------------------------------------------
UPDATE public.so_cai_vat_tu sc
SET ma_quy_cach = map.ma_moi
FROM temp_quy_cach_map map
WHERE sc.id_nguyen_lieu = map.id_nguyen_lieu 
  AND sc.ma_quy_cach = map.ma_cu
  AND map.ma_cu <> map.ma_moi;

-- -----------------------------------------------------------------------------------------
-- BƯỚC 4: CẬP NHẬT LẠI JSONB QUY CÁCH TRONG BẢNG NGUYÊN LIỆU THEO MÃ MỚI
-- -----------------------------------------------------------------------------------------
WITH aggregated_quy_cach AS (
  SELECT 
    id_nguyen_lieu,
    jsonb_agg(
      jsonb_build_object(
        'ma_quy_cach', ma_moi,
        'ten', COALESCE(ten, ''),
        'min_stock', COALESCE(min_stock, 0)
      ) ORDER BY so_thu_tu
    ) AS new_danh_sach
  FROM temp_quy_cach_map
  GROUP BY id_nguyen_lieu
)
UPDATE public.nguyen_lieu nl
SET danh_sach_quy_cach = COALESCE(agg.new_danh_sach, '[]'::jsonb)
FROM aggregated_quy_cach agg
WHERE nl.id = agg.id_nguyen_lieu;

-- -----------------------------------------------------------------------------------------
-- BƯỚC 5: DỌN DẸP BẢNG TẠM & HOÀN TẤT
-- -----------------------------------------------------------------------------------------
DROP TABLE IF EXISTS temp_quy_cach_map;

COMMIT;

-- HIỂN THỊ THÔNG BÁO HOÀN TẤT
DO $$ 
BEGIN
  RAISE NOTICE '=== MIGRATE PRODUCTION DATABASE LÊN CHUẨN DEV (v1 - 26/07/2026) HOÀN TẤT THÀNH CÔNG ===';
END $$;


-- ==========================================
-- FILE: docs/migration_enable_realtime_all_tables.sql
-- ==========================================

-- ==============================================================================
-- SCRIPT KÍCH HOẠT SUPABASE REALTIME CHO TOÀN BỘ CÁC BẢNG TRONG HỆ THỐNG
-- Ngày tạo: 02/08/2026
-- Mục đích: Bật tính năng Realtime (postgres_changes) cho toàn bộ bảng trong CSDL
-- ==============================================================================

-- 1. Đảm bảo publication supabase_realtime tồn tại (Mặc định trên Supabase luôn có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
        RAISE NOTICE 'Đã khởi tạo publication supabase_realtime';
    END IF;
END
$$;

-- 2. Thêm toàn bộ các bảng gốc (BASE TABLE) trong schema public vào publication supabase_realtime
-- Sử dụng khối DO để kiểm tra và thêm an toàn từng bảng, tránh lỗi nếu bảng đã tồn tại trong publication
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        -- Kiểm tra xem bảng đã có trong publication supabase_realtime chưa
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
            RAISE NOTICE 'Đã kích hoạt Realtime cho bảng: public.%', t;
        ELSE
            RAISE NOTICE 'Bảng public.% đã được kích hoạt Realtime từ trước.', t;
        END IF;
    END LOOP;
END
$$;

-- 3. Cấu hình REPLICA IDENTITY FULL cho toàn bộ 9 bảng nghiệp vụ cốt lõi
-- Giúp sự kiện UPDATE/DELETE nhận được đầy đủ dữ liệu dòng cũ và mới
ALTER TABLE IF EXISTS public.lo_giao_dich REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.so_cai_vat_tu REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.nguyen_lieu REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.cong_hang REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.don_hang REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.tai_khoan REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.cong_nhan REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.cong_doan REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.danh_muc_giao_dich REPLICA IDENTITY FULL;

-- 4. Kiểm tra danh sách các bảng đã được kích hoạt Realtime trong publication
SELECT pubname, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
ORDER BY tablename;


-- ==========================================
-- FILE: docs/migration_view_ton_kho.sql
-- ==========================================

-- Tạo View lấy ra duy nhất một dòng có created_at lớn nhất cho mỗi (id_nguyen_lieu, ma_quy_cach)
CREATE OR REPLACE VIEW public.view_ton_kho_hien_tai AS
SELECT DISTINCT ON (id_nguyen_lieu, ma_quy_cach)
    id_nguyen_lieu,
    ma_quy_cach,
    ton_kho_hien_tai
FROM public.so_cai_vat_tu
ORDER BY id_nguyen_lieu, ma_quy_cach, created_at DESC;

-- Cấp quyền (Grants) cho View để Next.js (Supabase Data API) có thể truy cập được
GRANT SELECT ON public.view_ton_kho_hien_tai TO anon, authenticated, service_role;


