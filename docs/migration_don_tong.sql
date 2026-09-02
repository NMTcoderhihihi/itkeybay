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
