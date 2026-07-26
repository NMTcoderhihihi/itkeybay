-- ====================================================================
-- SCRIPT MIGRATION & BẢO TOÀN DỮ LIỆU: CHUẨN HÓA MÃ QUY CÁCH VẬT TƯ
-- ====================================================================
-- Mục đích:
-- 1. Chuyển đổi toàn bộ mã quy cách thủ công cũ trong bảng `nguyen_lieu`
--    thành định dạng mã tự động chuẩn của hệ thống: QC-01, QC-02, QC-03...
-- 2. Cập nhật đồng bộ cột `ma_quy_cach` trong bảng `so_cai_vat_tu` từ Mã cũ
--    sang Mã mới để bảo toàn tuyệt đối lịch sử giao dịch và số dư tồn kho.
-- ====================================================================

DO $$
DECLARE
    nl RECORD;
    qc JSONB;
    idx INT;
    old_code TEXT;
    new_code TEXT;
    new_danh_sach JSONB;
    total_materials INT := 0;
    total_ledger_updated INT := 0;
    rows_affected INT := 0;
BEGIN
    RAISE NOTICE '=== BẮT ĐẦU CHUẨN HÓA MÃ QUY CÁCH VẬT TƯ ===';

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

            -- 1. Cập nhật bảng so_cai_vat_tu (lịch sử giao dịch & tồn kho)
            --    nếu mã cũ khác mã mới để bảo toàn dữ liệu liên kết
            IF old_code IS NOT NULL AND old_code <> '' AND old_code <> new_code THEN
                UPDATE public.so_cai_vat_tu 
                SET ma_quy_cach = new_code 
                WHERE id_nguyen_lieu = nl.id AND ma_quy_cach = old_code;

                GET DIAGNOSTICS rows_affected = ROW_COUNT;
                total_ledger_updated := total_ledger_updated + rows_affected;

                IF rows_affected > 0 THEN
                    RAISE NOTICE 'Vật tư [%]: Đã cập nhật % dòng trong Sổ cái từ [%] -> [%]',
                        nl.ten_nguyen_lieu, rows_affected, old_code, new_code;
                END IF;
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
    RAISE NOTICE 'Tổng số bản ghi Sổ cái vật tư đã bảo toàn & đồng bộ mã: %', total_ledger_updated;
END $$;
