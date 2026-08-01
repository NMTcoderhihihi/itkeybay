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
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Lỗi lấy danh sách vật tư:", error)
    return []
  }

  const { data: scData } = await supabase.from('so_cai_vat_tu').select('id_nguyen_lieu, ma_quy_cach, bien_dong_so_luong')
  const stockSumMap: Record<string, number> = {}
  if (scData) {
    scData.forEach((row) => {
      const key = `${row.id_nguyen_lieu}_${row.ma_quy_cach}`
      stockSumMap[key] = (stockSumMap[key] || 0) + Number(row.bien_dong_so_luong || 0)
    })
  }

  const result = (data || []).map((nl: any) => {
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

  return result as NguyenLieu[]
}

// Hàm hỗ trợ tự động gán mã quy cách QC-01, QC-02... tuần tự nếu thiếu
function autoAssignQuyCachCodes(list: QuyCach[]): QuyCach[] {
  let maxIndex = 0;
  list.forEach((qc) => {
    const match = qc.ma_quy_cach?.match(/^QC-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIndex) maxIndex = num;
    }
  });

  return list.map((qc) => {
    if (qc.ma_quy_cach && qc.ma_quy_cach.trim() !== "") {
      return qc;
    }
    maxIndex += 1;
    return {
      ma_quy_cach: `QC-${String(maxIndex).padStart(2, "0")}`,
      ten: qc.ten || `Quy cách ${maxIndex}`,
    };
  });
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
        danh_sach_quy_cach: autoAssignQuyCachCodes(payload.danh_sach_quy_cach)
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
      danh_sach_quy_cach: autoAssignQuyCachCodes(payload.danh_sach_quy_cach)
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
