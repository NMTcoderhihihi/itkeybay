"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"

export type ChiTietGiaoDich = {
  id_nguyen_lieu: string
  ma_quy_cach: string
  so_luong: number
}

export async function getDanhSachDanhMuc() {
  /* using imported supabase */
  const { data, error } = await supabase
    .from('danh_muc_giao_dich')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function taoPhieuGiaoDichKho(payload: {
  id_danh_muc: string
  id_cong_hang?: string
  loai_giao_dich: 'NHAP' | 'XUAT' | 'CHINH_SUA'
  ghi_chu: string
  danh_sach_anh: string[]
  chi_tiet: ChiTietGiaoDich[]
}) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền truy cập" }

  /* using imported supabase */
  
  // 1. Tạo Lô giao dịch
  const ma_lo = `${payload.loai_giao_dich === 'NHAP' ? 'NK' : 'XK'}${new Date().getTime().toString().slice(-6)}`
  
  const { data: loData, error: loError } = await supabase
    .from('lo_giao_dich')
    .insert({
      ma_lo,
      id_tai_khoan: session.id,
      id_danh_muc: payload.id_danh_muc,
      id_cong_hang: payload.id_cong_hang || null,
      ghi_chu: payload.ghi_chu,
      danh_sach_anh: payload.danh_sach_anh
    })
    .select('id')
    .single()

  if (loError) return { success: false, error: "Lỗi tạo Lô giao dịch: " + loError.message }
  const id_lo_giao_dich = loData.id

  // 2. Xử lý Sổ cái cho từng chi tiết
  const soCaiInserts = []
  for (const item of payload.chi_tiet) {
    // Lấy tồn kho hiện tại
    const { data: lastLedger } = await supabase
      .from('so_cai_vat_tu')
      .select('ton_kho_hien_tai')
      .eq('id_nguyen_lieu', item.id_nguyen_lieu)
      .eq('ma_quy_cach', item.ma_quy_cach)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const tonKhoCu = lastLedger?.ton_kho_hien_tai || 0
    
    // Nếu là XUAT thì số lượng biến động phải là số Âm
    const bienDong = payload.loai_giao_dich === 'NHAP' ? item.so_luong : -item.so_luong
    const tonKhoMoi = Number(tonKhoCu) + bienDong

    if (tonKhoMoi < 0) {
      // Rollback (Xóa lô giao dịch vừa tạo vì chưa có transaction API hoàn chỉnh trên Data API của Supabase)
      await supabase.from('lo_giao_dich').delete().eq('id', id_lo_giao_dich)
      return { success: false, error: `Số lượng xuất vượt quá tồn kho (Tồn: ${tonKhoCu})` }
    }

    soCaiInserts.push({
      id_lo_giao_dich,
      id_nguyen_lieu: item.id_nguyen_lieu,
      ma_quy_cach: item.ma_quy_cach,
      bien_dong_so_luong: bienDong,
      ton_kho_hien_tai: tonKhoMoi
    })
  }

  // 3. Insert Bulk vào Sổ cái
  if (soCaiInserts.length > 0) {
    const { error: ledgerError } = await supabase
      .from('so_cai_vat_tu')
      .insert(soCaiInserts)

    if (ledgerError) {
      await supabase.from('lo_giao_dich').delete().eq('id', id_lo_giao_dich)
      return { success: false, error: "Lỗi ghi sổ cái: " + ledgerError.message }
    }
  }

  revalidatePath('/kho')
  return { success: true }
}

export async function getTongQuanTonKho() {
  /* using imported supabase */
  const { data: nlData } = await supabase.from('nguyen_lieu').select('*').order('created_at', { ascending: false })
  const { data: scData } = await supabase.from('so_cai_vat_tu').select('id_nguyen_lieu, ma_quy_cach, bien_dong_so_luong')
  
  if (!nlData || !scData) return []

  // Tính tổng biến động số lượng (Nhập +, Xuất -) từ toàn bộ sổ cái cho mỗi (nguyen_lieu, quy_cach)
  const stockSumMap: Record<string, number> = {}
  scData.forEach((row) => {
    const key = `${row.id_nguyen_lieu}_${row.ma_quy_cach}`
    stockSumMap[key] = (stockSumMap[key] || 0) + Number(row.bien_dong_so_luong || 0)
  })

  // Map về giao diện với số lượng tồn kho chính xác
  const result = nlData.map(nl => {
    const quyCachTon = (nl.danh_sach_quy_cach || []).map((qc: any) => {
      const key = `${nl.id}_${qc.ma_quy_cach}`
      return {
        ...qc,
        ton_kho: stockSumMap[key] ?? 0
      }
    })
    return {
      ...nl,
      danh_sach_quy_cach: quyCachTon
    }
  })

  return result
}

export async function getSoCaiChiTiet(id_nguyen_lieu: string) {
  /* using imported supabase */
  const { data, error } = await supabase
    .from('so_cai_vat_tu')
    .select(`
      *,
      lo_giao_dich (
        ma_lo,
        ghi_chu,
        danh_sach_anh,
        ngay_tao,
        danh_muc_giao_dich (ten_danh_muc, loai_giao_dich),
        tai_khoan (ho_ten)
      )
    `)
    .eq('id_nguyen_lieu', id_nguyen_lieu)
    .order('created_at', { ascending: false })

  return data || []
}

export type TrangThaiLocSoCai = {
  ma_quy_cach?: string;
  tu_ngay?: string;
  den_ngay?: string;
  id_tai_khoan?: string;
  id_cong_hang?: string;
  id_danh_muc?: string;
}

export async function getSoCaiChiTietPaginated(
  id_nguyen_lieu: string, 
  page: number = 1, 
  limit: number = 10,
  filters?: TrangThaiLocSoCai
) {
  let query = supabase
    .from('so_cai_vat_tu')
    .select(`
      *,
      lo_giao_dich!inner (
        ma_lo,
        ghi_chu,
        danh_sach_anh,
        ngay_tao,
        id_tai_khoan,
        id_cong_hang,
        id_danh_muc,
        danh_muc_giao_dich (ten_danh_muc, loai_giao_dich),
        tai_khoan (ho_ten)
      )
    `, { count: 'exact' })
    .eq('id_nguyen_lieu', id_nguyen_lieu);

  if (filters?.ma_quy_cach && filters.ma_quy_cach !== 'ALL') {
    query = query.eq('ma_quy_cach', filters.ma_quy_cach);
  }

  if (filters?.tu_ngay) {
    query = query.gte('created_at', `${filters.tu_ngay}T00:00:00.000Z`);
  }
  
  if (filters?.den_ngay) {
    query = query.lte('created_at', `${filters.den_ngay}T23:59:59.999Z`);
  }

  if (filters?.id_tai_khoan && filters.id_tai_khoan !== 'ALL') {
    query = query.eq('lo_giao_dich.id_tai_khoan', filters.id_tai_khoan);
  }

  if (filters?.id_cong_hang && filters.id_cong_hang !== 'ALL') {
    query = query.eq('lo_giao_dich.id_cong_hang', filters.id_cong_hang);
  }

  if (filters?.id_danh_muc && filters.id_danh_muc !== 'ALL') {
    query = query.eq('lo_giao_dich.id_danh_muc', filters.id_danh_muc);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getSoCaiChiTietPaginated error:", error);
    return { data: [], total: 0 };
  }

  return { data: data || [], total: count || 0 };
}

export async function xuatBanThanhPham(payload: {
  id_cong_hang: string
  id_danh_muc: string
  danh_sach_anh: string[]
  ghi_chu: string
}) {
  const session = await getSession()
  if (!session) return { success: false, error: "Không có quyền" }

  if (!payload.danh_sach_anh || payload.danh_sach_anh.length === 0) {
    return { success: false, error: "Vui lòng cung cấp ảnh minh chứng giao hàng." }
  }

  const { error: loError } = await supabase.from('lo_giao_dich').insert({
    ma_lo: `BTP-XUAT-${Date.now().toString().slice(-6)}`,
    id_tai_khoan: session.id,
    id_danh_muc: payload.id_danh_muc,
    id_cong_hang: payload.id_cong_hang,
    danh_sach_anh: payload.danh_sach_anh,
    ghi_chu: payload.ghi_chu || 'Xuất bán thành phẩm (Giao hàng)'
  })

  if (loError) {
    return { success: false, error: "Lỗi tạo phiếu xuất BTP: " + loError.message }
  }

  const { error: chError } = await supabase
    .from('cong_hang')
    .update({ trang_thai_kho: 'DA_GIAO' })
    .eq('id', payload.id_cong_hang)

  if (chError) {
    return { success: false, error: "Lỗi cập nhật trạng thái kho: " + chError.message }
  }

  revalidatePath('/san-xuat')
  revalidatePath('/kho')
  return { success: true }
}
