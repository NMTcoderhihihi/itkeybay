import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Tải biến môi trường từ .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

console.log('Dotenv result:', result.error ? result.error : 'Success');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// SỬ DỤNG SERVICE_ROLE_KEY ĐỂ BYPASS RLS NẾU CÓ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('--- BẮT ĐẦU MIGRATION DỮ LIỆU CẤP PHÁT ---');

  // 1. Lấy tất cả lô giao dịch có danh sách đơn tổng (cũ)
  // Lưu ý: Cần chỉnh tên cột nếu bạn đã đổi tên thành danh_sach_don_tong_backup
  const { data: listGiaoDich, error: gdError } = await supabase
    .from('lo_giao_dich')
    .select('id, ngay_tao, danh_sach_don_tong_backup') // Sửa thành danh_sach_don_tong_backup nếu đã chạy đổi tên
    .not('danh_sach_don_tong_backup', 'is', null)
    .order('ngay_tao', { ascending: true }); // Chạy từ cũ nhất đến mới nhất

  if (gdError) {
    console.error('Lỗi lấy lô giao dịch:', gdError);
    return;
  }

  console.log(`Tìm thấy ${listGiaoDich.length} lô giao dịch cần migrate.`);

  // Biến tạm để theo dõi số lượng đã cấp phát của từng dòng sổ cái (Tránh cấp lố)
  const scAllocated: Record<string, number> = {};
  // Biến tạm để theo dõi số lượng đã nhận của từng dòng chi tiết đơn (Tránh đắp lố)
  const dtctReceived: Record<string, number> = {};

  for (const gd of listGiaoDich) {
    let dsDonTong = gd.danh_sach_don_tong_backup;
    if (typeof dsDonTong === 'string') {
      try { dsDonTong = JSON.parse(dsDonTong); } catch (e) {}
    }
    
    if (!Array.isArray(dsDonTong) || dsDonTong.length === 0) continue;

    console.log(`Đang xử lý Giao dịch: ${gd.id}`);

    // Lấy chi tiết sổ cái của lô giao dịch này (chỉ lấy loại NHAP tức là > 0)
    const { data: soCaiList } = await supabase
      .from('so_cai_vat_tu')
      .select('*')
      .eq('id_lo_giao_dich', gd.id)
      .gt('bien_dong_so_luong', 0);

    if (!soCaiList || soCaiList.length === 0) continue;

    // Duyệt qua từng Đơn tổng mà phiếu này gắn vào
    for (const idDonTong of dsDonTong) {
      // Lấy chi tiết yêu cầu của đơn tổng đó
      const { data: dtChiTietList } = await supabase
        .from('don_tong_chi_tiet')
        .select('*')
        .eq('id_don_tong', idDonTong);

      if (!dtChiTietList) continue;

      // Thuật toán đắp vật tư
      for (const sc of soCaiList) {
        const allocatedSoFar = scAllocated[sc.id] || 0;
        let available = Number(sc.bien_dong_so_luong) - allocatedSoFar;

        if (available <= 0) continue;

        // Tìm dòng yêu cầu khớp mã nguyen_lieu & quy_cach
        const targetCt = dtChiTietList.find(ct => 
          ct.id_nguyen_lieu === sc.id_nguyen_lieu && ct.ma_quy_cach === sc.ma_quy_cach
        );

        if (targetCt) {
          const receivedSoFar = dtctReceived[targetCt.id] || 0;
          const needs = Number(targetCt.so_luong_yeu_cau) - receivedSoFar;

          if (needs > 0) {
            // Cấp phát số lượng (chỉ lấy vừa đủ phần thiếu, hoặc vét sạch nếu available ít hơn)
            const capPhat = Math.min(needs, available);

            // 1. Insert vào bảng chi_tiet_cap_phat
            const { error: insError } = await supabase
              .from('chi_tiet_cap_phat')
              .insert({
                id_so_cai_vat_tu: sc.id,
                id_don_tong_chi_tiet: targetCt.id,
                so_luong_cap_phat: capPhat
              });

            if (insError) {
              console.error(`Lỗi insert chi_tiet_cap_phat:`, insError);
            } else {
              // Cập nhật biến tạm in-memory
              scAllocated[sc.id] = allocatedSoFar + capPhat;
              dtctReceived[targetCt.id] = receivedSoFar + capPhat;
              available -= capPhat;
              console.log(`  -> Đã cấp ${capPhat} (Mã: ${sc.ma_quy_cach}) cho Đơn ${idDonTong}`);
            }
          }
        }
      }
    }
  }

  console.log('--- HOÀN TẤT MIGRATION DỮ LIỆU ---');
  console.log('Lưu ý: Cột so_luong_da_nhap của bảng don_tong_chi_tiet sẽ tự động được Trigger cập nhật dựa trên dữ liệu mới insert này!');
}

migrateData();
