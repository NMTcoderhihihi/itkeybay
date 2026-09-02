"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export type ChiTietDonTong = {
  id_nguyen_lieu: string
  ma_quy_cach: string
  so_luong_yeu_cau: number
}

export async function getDanhSachDonTong() {
  const { data, error } = await supabase
    .from('don_tong')
    .select(`
      *,
      don_tong_chi_tiet (
        id_nguyen_lieu,
        ma_quy_cach,
        so_luong_yeu_cau,
        so_luong_da_nhap,
        nguyen_lieu (ten_nguyen_lieu, anh_minh_hoa, don_vi, danh_sach_quy_cach)
      )
    `)
    .order('ngay_tao', { ascending: false })

  if (error) {
    console.error("Error fetching don_tong:", error)
    return []
  }
  return data
}

export async function taoDonTong(payload: {
  ma_don_tong: string
  ten_don: string
  ghi_chu: string
  chi_tiet: ChiTietDonTong[]
}) {
  try {
    // 1. Tạo đơn tổng
    const { data: donTongData, error: donTongError } = await supabase
      .from('don_tong')
      .insert({
        ma_don_tong: payload.ma_don_tong,
        ten_don: payload.ten_don,
        ghi_chu: payload.ghi_chu,
        trang_thai: 'CHUA_DU'
      })
      .select('id')
      .single()

    if (donTongError) return { success: false, error: "Lỗi tạo đơn tổng: " + donTongError.message }

    const id_don_tong = donTongData.id

    // 2. Thêm chi tiết
    if (payload.chi_tiet.length > 0) {
      const chiTietInserts = payload.chi_tiet.map(item => ({
        id_don_tong,
        id_nguyen_lieu: item.id_nguyen_lieu,
        ma_quy_cach: item.ma_quy_cach,
        so_luong_yeu_cau: item.so_luong_yeu_cau,
        so_luong_da_nhap: 0
      }))

      const { error: ctError } = await supabase
        .from('don_tong_chi_tiet')
        .insert(chiTietInserts)

      if (ctError) {
        await supabase.from('don_tong').delete().eq('id', id_don_tong)
        return { success: false, error: "Lỗi thêm chi tiết đơn tổng: " + ctError.message }
      }
    }

    revalidatePath('/kho')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function capNhatDonTong(id: string, payload: {
  ma_don_tong: string
  ten_don: string
  ghi_chu: string
  chi_tiet: ChiTietDonTong[]
}) {
  try {
    const { error: updateError } = await supabase
      .from('don_tong')
      .update({
        ma_don_tong: payload.ma_don_tong,
        ten_don: payload.ten_don,
        ghi_chu: payload.ghi_chu
      })
      .eq('id', id)

    if (updateError) return { success: false, error: "Lỗi cập nhật đơn tổng: " + updateError.message }

    // Xóa chi tiết cũ và thêm lại để đơn giản
    await supabase.from('don_tong_chi_tiet').delete().eq('id_don_tong', id)

    if (payload.chi_tiet.length > 0) {
      const chiTietInserts = payload.chi_tiet.map(item => ({
        id_don_tong: id,
        id_nguyen_lieu: item.id_nguyen_lieu,
        ma_quy_cach: item.ma_quy_cach,
        so_luong_yeu_cau: item.so_luong_yeu_cau,
        so_luong_da_nhap: 0 // Chú ý: Khi sửa đơn tổng có thể mất số lượng đã nhập nếu thay đổi hoàn toàn vật tư
      }))

      const { error: ctError } = await supabase
        .from('don_tong_chi_tiet')
        .insert(chiTietInserts)

      if (ctError) {
        return { success: false, error: "Lỗi cập nhật chi tiết đơn tổng: " + ctError.message }
      }
    }

    revalidatePath('/kho')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function xoaDonTong(id: string) {
  const { error } = await supabase.from('don_tong').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/kho')
  return { success: true }
}

export async function getDonTongById(id: string) {
  const { data, error } = await supabase
    .from('don_tong')
    .select(`
      *,
      don_tong_chi_tiet (
        id_nguyen_lieu,
        ma_quy_cach,
        so_luong_yeu_cau,
        so_luong_da_nhap,
        nguyen_lieu (ten_nguyen_lieu, anh_minh_hoa, don_vi, danh_sach_quy_cach)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching don_tong by id:', error)
    return null
  }
  return data
}

export async function getGiaoDichByDonTong(idDonTong: string) {
  const { data, error } = await supabase
    .from('lo_giao_dich')
    .select(`
      *,
      tai_khoan (ho_ten),
      danh_muc_giao_dich (ten_danh_muc, loai_giao_dich),
      so_cai_vat_tu (
        id_nguyen_lieu,
        ma_quy_cach,
        bien_dong_so_luong,
        ton_kho_hien_tai,
        nguyen_lieu (ten_nguyen_lieu, don_vi, danh_sach_quy_cach)
      )
    `)
    .contains('danh_sach_don_tong', [idDonTong])
    .order('ngay_tao', { ascending: false })

  if (error) {
    console.error('Error fetching giao_dich by don_tong:', error)
    return []
  }
  return data
}
