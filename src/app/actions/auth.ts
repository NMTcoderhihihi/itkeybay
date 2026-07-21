"use server"

import { supabase } from '@/lib/supabase'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function checkNeedsSetup() {
  const { count, error } = await supabase
    .from('tai_khoan')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Database Error:', error)
    return false
  }
  return count === 0
}

export async function setupFirstAdmin(prevState: any, formData: FormData) {
  const phone = (formData.get('phone') as string).trim()
  const password = (formData.get('password') as string).trim()
  const name = (formData.get('name') as string).trim()

  // Xác nhận chỉ tạo khi rỗng
  const needsSetup = await checkNeedsSetup()
  if (!needsSetup) return { error: 'Hệ thống đã có tài khoản, không thể tạo thêm quyền Quản lý gốc từ màn hình này.' }

  const { data, error } = await supabase
    .from('tai_khoan')
    .insert([
      {
        so_dien_thoai: phone,
        mat_khau: password, // Theo yêu cầu, không băm một chiều
        vai_tro: 'Quan ly',
        ho_ten: name,
        dang_hoat_dong: true
      }
    ])
    .select()
    .single()

  if (error) return { error: error.message }

  await createSession({
    id: data.id,
    phone: data.so_dien_thoai,
    role: data.vai_tro,
    name: data.ho_ten,
    avatar: data.anh_dai_dien || null
  })

  redirect('/dashboard')
}

export async function login(prevState: any, formData: FormData) {
  const phone = (formData.get('phone') as string).trim()
  const password = (formData.get('password') as string).trim()

  const { data, error } = await supabase
    .from('tai_khoan')
    .select('*')
    .eq('so_dien_thoai', phone)
    .single()

  if (error || !data) {
    return { error: 'Sai số điện thoại hoặc tài khoản không tồn tại' }
  }

  if (!data.dang_hoat_dong) {
    return { error: 'Tài khoản đã bị vô hiệu hóa' }
  }

  if (data.mat_khau !== password) {
    return { error: 'Sai mật khẩu' }
  }

  await createSession({
    id: data.id,
    phone: data.so_dien_thoai,
    role: data.vai_tro,
    name: data.ho_ten,
    avatar: data.anh_dai_dien || null
  })

  redirect(data.vai_tro === 'Quan ly' ? '/dashboard' : '/kho')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
