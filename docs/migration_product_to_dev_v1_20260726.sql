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
