"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type QuyCach = {
  ma_quy_cach: string
  ten: string
}

export type NguyenLieu = {
  id: string
  ten_nguyen_lieu: string
  don_vi: string
  anh_minh_hoa?: string | null
  danh_sach_quy_cach: QuyCach[]
  ngay_tao: string
}

// 1. LẤY DANH SÁCH VẬT TƯ
export async function getNguyenLieuList() {
  /* using imported supabase */
  const { data, error } = await supabase
    .from('nguyen_lieu')
    .select('*')
    .order('ngay_tao', { ascending: false })

  if (error) {
    console.error("Lỗi lấy danh sách vật tư:", error)
    return []
  }

  return (data || []) as NguyenLieu[]
}

// 2. THÊM VẬT TƯ MỚI
export async function createNguyenLieu(payload: {
  ten_nguyen_lieu: string
  don_vi: string
  anh_minh_hoa?: string | null
  danh_sach_quy_cach: QuyCach[]
}) {
  /* using imported supabase */
  
  const { error } = await supabase
    .from('nguyen_lieu')
    .insert([
      {
        ten_nguyen_lieu: payload.ten_nguyen_lieu,
        don_vi: payload.don_vi,
        anh_minh_hoa: payload.anh_minh_hoa,
        danh_sach_quy_cach: payload.danh_sach_quy_cach
      }
    ])

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/kho')
  return { success: true }
}

// 3. CẬP NHẬT VẬT TƯ
export async function updateNguyenLieu(id: string, payload: {
  ten_nguyen_lieu: string
  don_vi: string
  anh_minh_hoa?: string | null
  danh_sach_quy_cach: QuyCach[]
}) {
  /* using imported supabase */
  
  const { error } = await supabase
    .from('nguyen_lieu')
    .update({
      ten_nguyen_lieu: payload.ten_nguyen_lieu,
      don_vi: payload.don_vi,
      anh_minh_hoa: payload.anh_minh_hoa,
      danh_sach_quy_cach: payload.danh_sach_quy_cach
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/kho')
  return { success: true }
}

// 4. XÓA VẬT TƯ
export async function deleteNguyenLieu(id: string) {
  /* using imported supabase */
  
  const { error } = await supabase
    .from('nguyen_lieu')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/kho')
  return { success: true }
}
