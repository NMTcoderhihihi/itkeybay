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
