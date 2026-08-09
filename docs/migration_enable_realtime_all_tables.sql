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
