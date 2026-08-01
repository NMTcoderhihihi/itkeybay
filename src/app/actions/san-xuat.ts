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
    const { data, error } = await supabase.from('cong_doan').update({
      ten_cong_doan: payload.ten_cong_doan,
      ghi_chu: payload.ghi_chu
    }).eq('id', payload.id).select().single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/san-xuat')
    return { success: true, data }
  } else {
    const { data, error } = await supabase.from('cong_doan').insert({
      ten_cong_doan: payload.ten_cong_doan,
      ghi_chu: payload.ghi_chu
    }).select().single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/san-xuat')
    return { success: true, data }
  }
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
      don_hang (*),
      lo_giao_dich (
        id, 
        ma_lo, 
        danh_sach_anh, 
        id_danh_muc, 
        ngay_tao, 
        ghi_chu, 
        danh_muc_giao_dich (ten_danh_muc, phan_he, loai_giao_dich)
      )
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

export async function getLichSuPhatLieu(id_cong_hang: string) {
  const { data, error } = await supabase
    .from('lo_giao_dich')
    .select(`
      id, ma_lo, ngay_tao, ghi_chu,
      tai_khoan (ho_ten),
      danh_muc_giao_dich (ten_danh_muc),
      so_cai_vat_tu (
        ma_quy_cach,
        bien_dong_so_luong,
        nguyen_lieu ( ten_nguyen_lieu, danh_sach_quy_cach )
      )
    `)
    .eq('id_cong_hang', id_cong_hang)
    .order('ngay_tao', { ascending: false })

  if (error) return []
  return data
}

export async function updateCongDoanProgress(id_cong_hang: string, newDanhSachCongDoan: any[]) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  const allCompleted = newDanhSachCongDoan.length > 0 && newDanhSachCongDoan.every((cd: any) => cd.da_xong);
  const updatePayload: any = { danh_sach_cong_doan: newDanhSachCongDoan };
  if (allCompleted) {
    updatePayload.trang_thai_sx = 'DA_LAM';
    updatePayload.trang_thai_kho = 'TON_KHO';
  }

  const { error } = await supabase
    .from('cong_hang')
    .update(updatePayload)
    .eq('id', id_cong_hang)

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/san-xuat/${id_cong_hang}`)
  revalidatePath('/san-xuat')
  return { success: true, allCompleted }
}

export async function updateCongHangDetails(id_cong_hang: string, ghi_chu: string, don_hang: ChiTietDonHang[]) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  // Cập nhật ghi chú
  const { error: updateError } = await supabase
    .from('cong_hang')
    .update({ ghi_chu })
    .eq('id', id_cong_hang)

  if (updateError) return { success: false, error: updateError.message }

  // Xóa đơn hàng cũ và thêm lại
  const { error: deleteError } = await supabase
    .from('don_hang')
    .delete()
    .eq('id_cong_hang', id_cong_hang)

  if (deleteError) return { success: false, error: deleteError.message }

  if (don_hang.length > 0) {
    const donHangInserts = don_hang.map(dh => ({
      id_cong_hang: id_cong_hang,
      ma_don_hang: dh.ma_don_hang,
      ma_hang: dh.ma_hang,
      so_luong_san_xuat: dh.so_luong_san_xuat
    }))
    const { error: insertError } = await supabase.from('don_hang').insert(donHangInserts)
    if (insertError) return { success: false, error: insertError.message }
  }

  revalidatePath(`/san-xuat/${id_cong_hang}`)
  revalidatePath('/san-xuat')
  return { success: true }
}

export async function completeCongHang(id_cong_hang: string, danh_sach_anh_hoan_thanh: string[] = []) {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') return { success: false, error: "Chỉ Quản lý mới được xác nhận Hoàn thành" }

  // 1. Tìm hoặc tạo danh mục hệ thống: Hoàn thành sản xuất (Nhập kho BTP)
  const { data: danhMuc } = await supabase
    .from('danh_muc_giao_dich')
    .select('id')
    .eq('ten_danh_muc', 'Hoàn thành sản xuất (Nhập kho BTP)')
    .eq('phan_he', 'BAN_THANH_PHAM')
    .single()

  let id_danh_muc = danhMuc?.id
  if (!id_danh_muc) {
    const { data: newDM } = await supabase
      .from('danh_muc_giao_dich')
      .insert({
        phan_he: 'BAN_THANH_PHAM',
        loai_giao_dich: 'NHAP',
        ten_danh_muc: 'Hoàn thành sản xuất (Nhập kho BTP)',
        la_he_thong: true,
        ghi_chu: 'Danh mục tự động của hệ thống khi nhập BTP từ công hàng hoàn thành',
        dang_hoat_dong: true
      })
      .select('id')
      .single()
    id_danh_muc = newDM?.id
  }

  // 2. Ghi nhận 1 Lô giao dịch nhập BTP vào hệ thống kèm mảng ảnh hoàn thành
  if (id_danh_muc) {
    await supabase.from('lo_giao_dich').insert({
      ma_lo: `BTP-NHAP-${Date.now().toString().slice(-6)}`,
      id_tai_khoan: session.id,
      id_danh_muc: id_danh_muc,
      id_cong_hang: id_cong_hang,
      danh_sach_anh: danh_sach_anh_hoan_thanh,
      ghi_chu: 'Nhập kho bán thành phẩm từ công hàng hoàn thành'
    })
  }

  // 3. Cập nhật trạng thái công hàng sang Đã làm & Tồn kho BTP
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

  // Kiểm tra ràng buộc trong lo_giao_dich (cấp phát nguyên liệu, nhập/xuất kho BTP)
  const { count, error: checkError } = await supabase
    .from('lo_giao_dich')
    .select('id', { count: 'exact', head: true })
    .eq('id_cong_hang', id)

  if (checkError) {
    return { success: false, error: "Lỗi kiểm tra ràng buộc: " + checkError.message }
  }

  if (count && count > 0) {
    return { 
      success: false, 
      error: "Công hàng này đã phát sinh giao dịch kho (cấp phát nguyên liệu hoặc nhập xuất BTP), không thể xóa để bảo đảm tính toàn vẹn dữ liệu sổ cái!" 
    }
  }

  // don_hang có ON DELETE CASCADE nên tự xóa
  const { error } = await supabase.from('cong_hang').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/san-xuat')
  revalidatePath('/kho')
  return { success: true }
}
