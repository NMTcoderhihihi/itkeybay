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
