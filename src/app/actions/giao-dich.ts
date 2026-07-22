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
  // Thay vì query toàn bộ sổ cái, ta sẽ query lấy bản ghi mới nhất của mỗi (nguyen_lieu, quy_cach)
  // Supabase/Postgres hỗ trợ DISTINCT ON
  /* using imported supabase */
  const { data, error } = await supabase.rpc('get_current_stock') // Cần tạo function, hoặc lấy hết rồi tính
  // Để đơn giản (vì không có RPC sẵn), ta lấy toàn bộ nguyen_lieu và map với sổ cái
  const { data: nlData } = await supabase.from('nguyen_lieu').select('*')
  const { data: scData } = await supabase.from('so_cai_vat_tu').select('*').order('created_at', { ascending: false })
  
  if (!nlData || !scData) return []

  // Group by nguyen_lieu & quy_cach để lấy cái đầu tiên (mới nhất)
  const stockMap: Record<string, any> = {}
  scData.forEach((row) => {
    const key = `${row.id_nguyen_lieu}_${row.ma_quy_cach}`
    if (!stockMap[key]) {
      stockMap[key] = row
    }
  })

  // Map về giao diện
  const result = nlData.map(nl => {
    const quyCachTon = nl.danh_sach_quy_cach.map((qc: any) => {
      const key = `${nl.id}_${qc.ma_quy_cach}`
      return {
        ...qc,
        ton_kho: stockMap[key]?.ton_kho_hien_tai || 0
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
