"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Vui lòng đăng nhập.' };

  const ho_ten = formData.get('ho_ten') as string;
  const so_dien_thoai = formData.get('so_dien_thoai') as string;
  const anh_dai_dien = formData.get('anh_dai_dien') as string;

  if (!ho_ten || !so_dien_thoai) {
    return { error: 'Họ tên và Số điện thoại không được để trống.' };
  }

  try {
    const { error } = await supabase
      .from('tai_khoan')
      .update({ ho_ten, so_dien_thoai, anh_dai_dien })
      .eq('id', session.id);
    
    if (error) throw error;
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') return { error: 'Số điện thoại này đã được sử dụng bởi người khác.' };
    return { error: error.message || 'Lỗi khi cập nhật hồ sơ.' };
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: 'Vui lòng đăng nhập.' };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!currentPassword || !newPassword) {
    return { error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' };
  }

  // Xác thực mật khẩu cũ
  const { data: userData, error: fetchError } = await supabase
    .from('tai_khoan')
    .select('mat_khau')
    .eq('id', session.id)
    .single();

  if (fetchError || !userData) return { error: 'Lỗi xác thực người dùng.' };
  if (userData.mat_khau !== currentPassword) return { error: 'Mật khẩu cũ không chính xác.' };

  // Cập nhật mật khẩu mới
  const { error: updateError } = await supabase
    .from('tai_khoan')
    .update({ mat_khau: newPassword })
    .eq('id', session.id);

  if (updateError) return { error: 'Lỗi khi đổi mật khẩu.' };
  return { success: true };
}
