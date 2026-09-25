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

    const { data: currentDetails } = await supabase.from('don_tong_chi_tiet').select('*').eq('id_don_tong', id)
    const existing = currentDetails || []
    const incomingKeys = payload.chi_tiet.map(c => `${c.id_nguyen_lieu}_${c.ma_quy_cach}`)

    const toDeleteIds = []
    for (const ex of existing) {
      const key = `${ex.id_nguyen_lieu}_${ex.ma_quy_cach}`
      if (!incomingKeys.includes(key)) {
        if (Number(ex.so_luong_da_nhap) > 0) {
          return { success: false, error: "Không thể xóa vật tư đã có dữ liệu nhập kho (Quy cách: " + ex.ma_quy_cach + ")" }
        }
        toDeleteIds.push(ex.id)
      }
    }

    if (toDeleteIds.length > 0) {
      await supabase.from('don_tong_chi_tiet').delete().in('id', toDeleteIds)
    }

    for (const item of payload.chi_tiet) {
      const key = `${item.id_nguyen_lieu}_${item.ma_quy_cach}`
      const ex = existing.find(e => `${e.id_nguyen_lieu}_${e.ma_quy_cach}` === key)
      if (ex) {
        if (Number(item.so_luong_yeu_cau) < Number(ex.so_luong_da_nhap)) {
          return { success: false, error: `Không thể giảm số lượng yêu cầu xuống dưới mức đã thực cấp (${ex.so_luong_da_nhap}) đối với quy cách: ${ex.ma_quy_cach}. Vui lòng rút vật tư ra khỏi đơn trước.` }
        }
        if (Number(ex.so_luong_yeu_cau) !== Number(item.so_luong_yeu_cau)) {
          await supabase.from('don_tong_chi_tiet').update({ so_luong_yeu_cau: item.so_luong_yeu_cau }).eq('id', ex.id)
        }
      } else {
        await supabase.from('don_tong_chi_tiet').insert({
          id_don_tong: id,
          id_nguyen_lieu: item.id_nguyen_lieu,
          ma_quy_cach: item.ma_quy_cach,
          so_luong_yeu_cau: item.so_luong_yeu_cau
        })
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
        id,
        id_nguyen_lieu,
        ma_quy_cach,
        so_luong_yeu_cau,
        so_luong_da_nhap,
        nguyen_lieu (ten_nguyen_lieu, anh_minh_hoa, don_vi, danh_sach_quy_cach),
        chi_tiet_cap_phat (
          id,
          so_luong_cap_phat,
          so_cai_vat_tu (
            id,
            bien_dong_so_luong,
            lo_giao_dich (ma_lo, ngay_tao)
          )
        )
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
  // 1. Lấy tất cả chi_tiet_cap_phat liên quan đến đơn tổng này
  const { data: dtct } = await supabase.from('don_tong_chi_tiet').select('id').eq('id_don_tong', idDonTong);
  if (!dtct || dtct.length === 0) return [];

  const dtctIds = dtct.map(c => c.id);
  const { data: capPhat } = await supabase.from('chi_tiet_cap_phat').select('id_so_cai_vat_tu').in('id_don_tong_chi_tiet', dtctIds);
  if (!capPhat || capPhat.length === 0) return [];

  const soCaiIds = capPhat.map(c => c.id_so_cai_vat_tu);
  const { data: soCai } = await supabase.from('so_cai_vat_tu').select('id_lo_giao_dich').in('id', soCaiIds);
  if (!soCai || soCai.length === 0) return [];

  const loIds = Array.from(new Set(soCai.map(sc => sc.id_lo_giao_dich)));

  const { data, error } = await supabase
    .from('lo_giao_dich')
    .select(`
      *,
      tai_khoan (ho_ten),
      danh_muc_giao_dich (ten_danh_muc, loai_giao_dich),
      so_cai_vat_tu (
        id,
        id_nguyen_lieu,
        ma_quy_cach,
        bien_dong_so_luong,
        ton_kho_hien_tai,
        nguyen_lieu (ten_nguyen_lieu, don_vi, danh_sach_quy_cach),
        chi_tiet_cap_phat (
          id,
          so_luong_cap_phat,
          id_don_tong_chi_tiet
        )
      )
    `)
    .in('id', loIds)
    .order('ngay_tao', { ascending: false })

  if (error) {
    console.error('Error fetching giao_dich by don_tong:', error)
    return []
  }
  return data
}

export async function getFreeInventoryForMaterial(idNguyenLieu: string, maQuyCach: string) {
  const { data: soCaiList, error } = await supabase
    .from('so_cai_vat_tu')
    .select(`
      id,
      bien_dong_so_luong,
      lo_giao_dich (ma_lo, ngay_tao),
      chi_tiet_cap_phat (so_luong_cap_phat)
    `)
    .eq('id_nguyen_lieu', idNguyenLieu)
    .eq('ma_quy_cach', maQuyCach)
    .gt('bien_dong_so_luong', 0)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching free inventory:', error);
    return [];
  }

  const freeList = soCaiList.map((sc: any) => {
    const allocated = sc.chi_tiet_cap_phat.reduce((sum: number, cp: any) => sum + Number(cp.so_luong_cap_phat), 0);
    const free = Number(sc.bien_dong_so_luong) - allocated;
    return {
      id_so_cai_vat_tu: sc.id,
      ma_lo: sc.lo_giao_dich?.ma_lo,
      ngay_tao: sc.lo_giao_dich?.ngay_tao,
      bien_dong_so_luong: Number(sc.bien_dong_so_luong),
      allocated,
      free
    };
  }).filter((item: any) => item.free > 0);

  return freeList;
}

export async function allocateFreeInventory(idDonTongChiTiet: string, allocations: { id_so_cai_vat_tu: string, so_luong: number }[], idDonTong: string) {
  if (!allocations || allocations.length === 0) return { success: true };

  const inserts = allocations.map(a => ({
    id_don_tong_chi_tiet: idDonTongChiTiet,
    id_so_cai_vat_tu: a.id_so_cai_vat_tu,
    so_luong_cap_phat: a.so_luong
  }));

  const { error } = await supabase.from('chi_tiet_cap_phat').insert(inserts);
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Re-check master order status
  const { data: updatedCtList } = await supabase
    .from('don_tong_chi_tiet')
    .select('so_luong_yeu_cau, so_luong_da_nhap')
    .eq('id_don_tong', idDonTong);

  if (updatedCtList && updatedCtList.length > 0) {
    const isAllDone = updatedCtList.every(ct => Number(ct.so_luong_da_nhap) >= Number(ct.so_luong_yeu_cau));
    await supabase.from('don_tong').update({ trang_thai: isAllDone ? 'DA_DU' : 'CHUA_DU' }).eq('id', idDonTong);
  }

  revalidatePath('/kho', 'layout');
  return { success: true };
}

export async function getAllocatedInventoryForMaterial(idDonTongChiTiet: string) {
  const { data, error } = await supabase
    .from('chi_tiet_cap_phat')
    .select(`
      id,
      so_luong_cap_phat,
      so_cai_vat_tu (
        id,
        bien_dong_so_luong,
        lo_giao_dich (ma_lo, ngay_tao)
      )
    `)
    .eq('id_don_tong_chi_tiet', idDonTongChiTiet);

  if (error) {
    console.error('Error fetching allocated inventory:', error);
    return [];
  }

  return data.map((cp: any) => ({
    id_cap_phat: cp.id,
    id_so_cai_vat_tu: cp.so_cai_vat_tu?.id,
    ma_lo: cp.so_cai_vat_tu?.lo_giao_dich?.ma_lo,
    ngay_tao: cp.so_cai_vat_tu?.lo_giao_dich?.ngay_tao,
    so_luong_cap_phat: Number(cp.so_luong_cap_phat)
  }));
}

export async function withdrawAllocatedInventory(withdrawals: { id_cap_phat: string, so_luong_rut: number }[], idDonTong: string): Promise<{ success: boolean; error?: string }> {
  if (!withdrawals || withdrawals.length === 0) return { success: true };

  try {
    for (const w of withdrawals) {
      const { data: cp } = await supabase.from('chi_tiet_cap_phat').select('so_luong_cap_phat').eq('id', w.id_cap_phat).single();
      if (cp) {
        const current = Number(cp.so_luong_cap_phat);
        const remaining = current - w.so_luong_rut;
        if (remaining <= 0) {
          await supabase.from('chi_tiet_cap_phat').delete().eq('id', w.id_cap_phat);
        } else {
          await supabase.from('chi_tiet_cap_phat').update({ so_luong_cap_phat: remaining }).eq('id', w.id_cap_phat);
        }
      }
    }

    const { data: updatedCtList } = await supabase
      .from('don_tong_chi_tiet')
      .select('so_luong_yeu_cau, so_luong_da_nhap')
      .eq('id_don_tong', idDonTong);

    if (updatedCtList && updatedCtList.length > 0) {
      const isAllDone = updatedCtList.every(ct => Number(ct.so_luong_da_nhap) >= Number(ct.so_luong_yeu_cau));
      await supabase.from('don_tong').update({ trang_thai: isAllDone ? 'DA_DU' : 'CHUA_DU' }).eq('id', idDonTong);
    }

    revalidatePath('/kho', 'layout');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
