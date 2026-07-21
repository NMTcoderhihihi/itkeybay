"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

export async function getDanhMucGiaoDich() {
  const { data, error } = await supabase
    .from('danh_muc_giao_dich')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching danh_muc:', error);
    return [];
  }
  return data;
}

export async function saveDanhMuc(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    return { error: 'Bạn không có quyền thực hiện chức năng này.' };
  }

  const id = formData.get('id') as string;
  const ten_danh_muc = formData.get('ten_danh_muc') as string;
  const phan_he = formData.get('phan_he') as string;
  const loai_giao_dich = formData.get('loai_giao_dich') as string;
  const ghi_chu = formData.get('ghi_chu') as string;
  const dang_hoat_dong = formData.get('dang_hoat_dong') === 'true';

  if (!ten_danh_muc || !phan_he || !loai_giao_dich) {
    return { error: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' };
  }

  try {
    if (id) {
      // Update
      const { error } = await supabase
        .from('danh_muc_giao_dich')
        .update({
          ten_danh_muc,
          loai_giao_dich,
          ghi_chu,
          dang_hoat_dong
        })
        .eq('id', id)
        .eq('la_he_thong', false); // Cấm sửa mục hệ thống
        
      if (error) throw error;
    } else {
      // Create
      const { error } = await supabase
        .from('danh_muc_giao_dich')
        .insert([{
          ten_danh_muc,
          phan_he,
          loai_giao_dich,
          ghi_chu,
          dang_hoat_dong: true
        }]);
        
      if (error) throw error;
    }

    revalidatePath('/danh-muc');
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi khi lưu danh mục:', error);
    return { error: error.message || 'Có lỗi xảy ra khi lưu.' };
  }
}

export async function deleteDanhMuc(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    return { error: 'Bạn không có quyền thực hiện chức năng này.' };
  }
  
  // 1. Check if used in lo_giao_dich
  const { count, error: countError } = await supabase
    .from('lo_giao_dich')
    .select('*', { count: 'exact', head: true })
    .eq('id_danh_muc', id);
    
  if (countError) {
    return { error: 'Lỗi kiểm tra dữ liệu liên quan.' };
  }
  
  if (count && count > 0) {
    return { error: 'Không thể xoá danh mục này vì đã có phiếu giao dịch sử dụng nó. Bạn chỉ có thể Sửa và Tắt trạng thái Hoạt động!' };
  }

  // 2. Delete if not used and not system
  const { error } = await supabase
    .from('danh_muc_giao_dich')
    .delete()
    .eq('id', id)
    .eq('la_he_thong', false);
    
  if (error) {
    return { error: 'Lỗi khi xoá danh mục.' };
  }
  
  revalidatePath('/danh-muc');
  return { success: true };
}
