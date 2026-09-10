-- 1. Tạo bảng trung gian Cấp Phát Chi Tiết
CREATE TABLE public.chi_tiet_cap_phat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_so_cai_vat_tu UUID NOT NULL REFERENCES public.so_cai_vat_tu(id) ON DELETE CASCADE,
    id_don_tong_chi_tiet UUID NOT NULL REFERENCES public.don_tong_chi_tiet(id) ON DELETE CASCADE,
    so_luong_cap_phat NUMERIC NOT NULL CHECK (so_luong_cap_phat > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thêm index để tăng tốc độ query (Join thường xuyên)
CREATE INDEX idx_cap_phat_so_cai ON public.chi_tiet_cap_phat(id_so_cai_vat_tu);
CREATE INDEX idx_cap_phat_don_tong_chi_tiet ON public.chi_tiet_cap_phat(id_don_tong_chi_tiet);

-- 2. Tùy chọn: Đổi tên cột cũ thành dạng backup để giữ an toàn trong lúc migrate
-- Chỉ drop hoàn toàn sau khi chạy script TS thành công.
ALTER TABLE public.lo_giao_dich RENAME COLUMN danh_sach_don_tong TO danh_sach_don_tong_backup;

-- 3. Tạo Trigger cập nhật tự động (Cache) so_luong_da_nhap vào don_tong_chi_tiet
CREATE OR REPLACE FUNCTION update_don_tong_chi_tiet_so_luong()
RETURNS TRIGGER AS $$
BEGIN
    -- Khi Insert / Update
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.don_tong_chi_tiet
        SET so_luong_da_nhap = (
            SELECT COALESCE(SUM(so_luong_cap_phat), 0)
            FROM public.chi_tiet_cap_phat
            WHERE id_don_tong_chi_tiet = NEW.id_don_tong_chi_tiet
        )
        WHERE id = NEW.id_don_tong_chi_tiet;
    END IF;

    -- Khi Delete
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.don_tong_chi_tiet
        SET so_luong_da_nhap = (
            SELECT COALESCE(SUM(so_luong_cap_phat), 0)
            FROM public.chi_tiet_cap_phat
            WHERE id_don_tong_chi_tiet = OLD.id_don_tong_chi_tiet
        )
        WHERE id = OLD.id_don_tong_chi_tiet;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cap_phat
AFTER INSERT OR UPDATE OR DELETE ON public.chi_tiet_cap_phat
FOR EACH ROW EXECUTE FUNCTION update_don_tong_chi_tiet_so_luong();
