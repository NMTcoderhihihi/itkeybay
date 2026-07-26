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
