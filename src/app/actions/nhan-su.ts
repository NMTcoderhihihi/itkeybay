"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

// ==========================================
// TÀI KHOẢN (System Accounts)
// ==========================================

export async function getTaiKhoan() {
  const { data, error } = await supabase
    .from('tai_khoan')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tai_khoan:', error);
    return [];
  }
  return data;
}

export async function saveTaiKhoan(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') return { error: 'Không có quyền truy cập' };

  const id = formData.get('id') as string;
  const ho_ten = formData.get('ho_ten') as string;
  const so_dien_thoai = formData.get('so_dien_thoai') as string;
  const mat_khau = formData.get('mat_khau') as string;
  const vai_tro = formData.get('vai_tro') as string;
  const anh_dai_dien = formData.get('anh_dai_dien') as string;
  const dang_hoat_dong = formData.get('dang_hoat_dong') === 'true';

  if (!ho_ten || !so_dien_thoai || !mat_khau || !vai_tro) {
    return { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' };
  }

  try {
    if (id) {
      const { error } = await supabase
        .from('tai_khoan')
        .update({ ho_ten, so_dien_thoai, mat_khau, vai_tro, anh_dai_dien, dang_hoat_dong })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('tai_khoan')
        .insert([{ ho_ten, so_dien_thoai, mat_khau, vai_tro, anh_dai_dien, dang_hoat_dong }]);
      if (error) throw error;
    }
    revalidatePath('/nhan-su');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') return { error: 'Số điện thoại này đã được sử dụng.' };
    return { error: error.message || 'Lỗi khi lưu tài khoản.' };
  }
}

export async function deleteTaiKhoan(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') return { error: 'Không có quyền truy cập' };
  
  if (session.id === id) return { error: 'Không thể xoá chính tài khoản đang đăng nhập.' };

  const { count, error: countError } = await supabase
    .from('lo_giao_dich')
    .select('*', { count: 'exact', head: true })
    .eq('id_tai_khoan', id);

  if (count && count > 0) {
    return { error: 'Tài khoản này đã lập phiếu giao dịch. Bạn chỉ có thể khóa (tắt trạng thái hoạt động) chứ không thể xóa.' };
  }

  const { error } = await supabase.from('tai_khoan').delete().eq('id', id);
  if (error) return { error: 'Lỗi khi xoá.' };
  
  revalidatePath('/nhan-su');
  return { success: true };
}

// ==========================================
// CÔNG NHÂN (Factory Workers)
// ==========================================

export async function getCongNhan() {
  const { data, error } = await supabase
    .from('cong_nhan')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching cong_nhan:', error);
    return [];
  }
  return data;
}

export async function saveCongNhan(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') return { error: 'Không có quyền truy cập' };

  const id = formData.get('id') as string;
  const ma_cong_nhan = formData.get('ma_cong_nhan') as string;
  const ho_ten = formData.get('ho_ten') as string;
  const so_dien_thoai = formData.get('so_dien_thoai') as string;
  const vai_tro = formData.get('vai_tro') as string;
  const ghi_chu = formData.get('ghi_chu') as string;

  if (!ma_cong_nhan || !ho_ten) {
    return { error: 'Vui lòng nhập Mã và Họ tên công nhân.' };
  }

  try {
    if (id) {
      const { error } = await supabase
        .from('cong_nhan')
        .update({ ma_cong_nhan, ho_ten, so_dien_thoai, vai_tro, ghi_chu })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cong_nhan')
        .insert([{ ma_cong_nhan, ho_ten, so_dien_thoai, vai_tro, ghi_chu }]);
      if (error) throw error;
    }
    revalidatePath('/nhan-su');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') return { error: 'Mã công nhân này đã tồn tại.' };
    return { error: error.message || 'Lỗi khi lưu công nhân.' };
  }
}

export async function deleteCongNhan(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') return { error: 'Không có quyền truy cập' };

  // Need to check if worker is in JSONB array of cong_hang (danh_sach_cong_doan)
  // In a real robust system, we would query or use a DB function. For now we will just try deleting 
  // and let Postgres handle constraints if any, or query directly. Since it's JSONB, it's harder to restrict via foreign key.
  // Since it's JSONB, there's no native foreign key constraint to stop deletion. We must query manually.
  
  const { data: checkData, error: checkError } = await supabase
    .from('cong_hang')
    .select('id')
    .contains('danh_sach_cong_doan', `[{"id_cong_nhan": "${id}"}]`)
    .limit(1);

  if (checkData && checkData.length > 0) {
    return { error: 'Công nhân này đã được phân công trong ít nhất 1 công hàng. Không thể xoá.' };
  }

  const { error } = await supabase.from('cong_nhan').delete().eq('id', id);
  if (error) return { error: 'Lỗi khi xoá công nhân.' };

  revalidatePath('/nhan-su');
  return { success: true };
}
