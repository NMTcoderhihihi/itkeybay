"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"

// =====================================
// QUẢN LÝ CÔNG ĐOẠN SẢN XUẤT
// =====================================

export async function getCongDoanList() {
  const { data, error } = await supabase
    .from('cong_doan')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return []
  return data
}

export async function saveCongDoan(payload: { id?: string; ten_cong_doan: string; ghi_chu?: string }) {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') return { success: false, error: "Không có quyền" }

  if (payload.id) {
    const { error } = await supabase.from('cong_doan').update({
      ten_cong_doan: payload.ten_cong_doan,
      ghi_chu: payload.ghi_chu
    }).eq('id', payload.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('cong_doan').insert({
      ten_cong_doan: payload.ten_cong_doan,
      ghi_chu: payload.ghi_chu
    })
    if (error) return { success: false, error: error.message }
  }
  
  revalidatePath('/san-xuat')
  return { success: true }
}

export async function deleteCongDoan(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') return { success: false, error: "Không có quyền" }

  const { error } = await supabase.from('cong_doan').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/san-xuat')
  return { success: true }
}

// =====================================
// QUẢN LÝ CÔNG HÀNG & ĐƠN HÀNG
// =====================================

export type ChiTietDonHang = {
  ma_don_hang: string
  ma_hang: string
  so_luong_san_xuat: number
}

export async function createCongHang(payload: {
  ma_cong_hang: string
  ghi_chu: string
  don_hang: ChiTietDonHang[]
  cong_doan_ids: string[]
}) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  // Chuẩn bị JSONB danh_sach_cong_doan
  const danh_sach_cong_doan = payload.cong_doan_ids.map(id => ({
    id_cong_doan: id,
    id_cong_nhan: null,
    da_xong: false,
    ngay_cap_nhat: null
  }))

  // Tạo công hàng
  const { data: congHangData, error: chError } = await supabase
    .from('cong_hang')
    .insert({
      ma_cong_hang: payload.ma_cong_hang,
      ghi_chu: payload.ghi_chu,
      danh_sach_cong_doan,
      trang_thai_sx: 'CHUA_LAM',
      trang_thai_kho: 'CHUA_NHAP'
    })
    .select('id')
    .single()

  if (chError) return { success: false, error: "Lỗi tạo Công hàng: " + chError.message }

  // Tạo các đơn hàng con (bulk insert)
  if (payload.don_hang.length > 0) {
    const donHangInserts = payload.don_hang.map(dh => ({
      id_cong_hang: congHangData.id,
      ma_don_hang: dh.ma_don_hang,
      ma_hang: dh.ma_hang,
      so_luong_san_xuat: dh.so_luong_san_xuat
    }))

    const { error: dhError } = await supabase.from('don_hang').insert(donHangInserts)
    if (dhError) {
      // rollback manually since no transaction api yet
      await supabase.from('cong_hang').delete().eq('id', congHangData.id)
      return { success: false, error: "Lỗi tạo Đơn hàng con: " + dhError.message }
    }
  }

  revalidatePath('/san-xuat')
  return { success: true }
}

export async function getCongHangList() {
  const { data, error } = await supabase
    .from('cong_hang')
    .select(`
      *,
      don_hang (*)
    `)
    .order('ngay_tao', { ascending: false })

  if (error) return []
  return data
}

export async function getCongHangDetail(id: string) {
  const { data, error } = await supabase
    .from('cong_hang')
    .select(`
      *,
      don_hang (*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updateCongDoanProgress(id_cong_hang: string, newDanhSachCongDoan: any[]) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  const { error } = await supabase
    .from('cong_hang')
    .update({ danh_sach_cong_doan: newDanhSachCongDoan })
    .eq('id', id_cong_hang)

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/san-xuat/${id_cong_hang}`)
  revalidatePath('/san-xuat')
  return { success: true }
}

export async function completeCongHang(id_cong_hang: string) {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') return { success: false, error: "Chỉ Quản lý mới được xác nhận Hoàn thành" }

  const { error } = await supabase
    .from('cong_hang')
    .update({ 
      trang_thai_sx: 'DA_LAM',
      trang_thai_kho: 'TON_KHO',
      ngay_hoan_thanh: new Date().toISOString()
    })
    .eq('id', id_cong_hang)

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/san-xuat/${id_cong_hang}`)
  revalidatePath('/san-xuat')
  revalidatePath('/kho')
  return { success: true }
}

export async function startCongHang(id_cong_hang: string) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  const { error } = await supabase
    .from('cong_hang')
    .update({ trang_thai_sx: 'DANG_LAM' })
    .eq('id', id_cong_hang)

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/san-xuat/${id_cong_hang}`)
  revalidatePath('/san-xuat')
  return { success: true }
}

export async function deleteCongHang(id: string) {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') return { success: false, error: "Không có quyền" }

  // don_hang có ON DELETE CASCADE nên tự xóa
  const { error } = await supabase.from('cong_hang').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/san-xuat')
  return { success: true }
}
