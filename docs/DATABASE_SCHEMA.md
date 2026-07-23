# Database Schema (Kiến trúc CSDL Supabase)

Dự án sử dụng Supabase (PostgreSQL) làm cơ sở dữ liệu chính.

## Các bảng chính:
1. **`tai_khoan`**: 
   - `id`, `ho_ten`, `so_dien_thoai`, `mat_khau`, `vai_tro` (Quan ly/Nhan vien), `anh_dai_dien`, `dang_hoat_dong`, `created_at`.
2. **`cong_nhan`**:
   - `id`, `ma_cong_nhan`, `ho_ten`, `so_dien_thoai`, `vai_tro`, `ghi_chu`, `created_at`.
3. **`danh_muc_giao_dich`**:
   - `id`, `phan_he`, `loai_giao_dich` (NHAP, XUAT, CHINH_SUA), `ten_danh_muc`, `la_he_thong`, `ghi_chu`, `dang_hoat_dong`.
4. **`nguyen_lieu`** (Vật tư):
   - `id`, `ten_nguyen_lieu`, `don_vi`, `anh_minh_hoa`, `muc_canh_bao_ton_kho`, `ghi_chu`, `danh_sach_quy_cach` (JSONB - Mảng chứa tên & mã quy cách).
5. **`lo_giao_dich`** (Phiếu giao dịch):
   - `id`, `ma_lo`, `id_danh_muc_giao_dich`, `id_tai_khoan` (Người tạo), `ghi_chu`, `danh_sach_anh` (Mảng URL ảnh minh chứng), `ngay_tao`.
6. **`chi_tiet_giao_dich`**:
   - `id`, `id_lo_giao_dich`, `id_nguyen_lieu`, `ma_quy_cach`, `so_luong`, `don_gia`.
7. **`so_cai_vat_tu`** (Ledger):
   - `id`, `id_nguyen_lieu`, `ma_quy_cach`, `id_lo_giao_dich`, `bien_dong_so_luong`, `ton_kho_hien_tai`, `created_at`.

## Quy trình nhập xuất:
- Bước 1: Tạo `lo_giao_dich`.
- Bước 2: Tạo các `chi_tiet_giao_dich` tương ứng.
- Bước 3: Hàm Trigger (hoặc logic API) sẽ cập nhật `so_cai_vat_tu` tính lại `ton_kho_hien_tai` dựa trên `bien_dong_so_luong`.
