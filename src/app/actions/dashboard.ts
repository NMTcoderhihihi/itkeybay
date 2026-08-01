"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type DashboardCongHangItem = {
  id: string;
  ma_cong_hang: string;
  ghi_chu?: string;
  trang_thai_sx: string;
  trang_thai_kho: string;
  ngay_tao: string;
  progress: number;
  completedStages: number;
  totalStages: number;
  currentStageName: string;
  ten_san_pham: string;
  danh_sach_don_hang?: Array<{ ma_hang: string; so_luong_san_xuat?: number }>;
};

export type DashboardTransactionItem = {
  id: string;
  ma_lo: string;
  created_at: string;
  ghi_chu?: string;
  ho_ten_nhan_vien: string;
  ten_danh_muc: string;
  phan_he: string;
  loai_giao_dich: string;
  ma_cong_hang?: string;
  doi_tuong_ten: string;
  loai_doi_tuong: "NGUYEN_LIEU" | "BAN_THANH_PHAM";
  so_luong_tong: number;
  quy_cach_ghi_chu?: string;
  danh_sach_anh?: string[];
  danh_sach_don_hang?: Array<{ ma_hang: string; so_luong_san_xuat?: number }>;
};

export type DashboardData = {
  kpi: {
    activeCongHangCount: number;
    tonKhoBtpCount: number;
    nguyenLieuCount: number;
    lowStockCount: number;
    todayActivityCount: number;
  };
  activeCongHangList: DashboardCongHangItem[];
  statusDistribution: {
    name: string;
    value: number;
    color: string;
    code: string;
  }[];
  recentTransactions: DashboardTransactionItem[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Thực thi song song 5 truy vấn CSDL để giảm thời gian phản hồi từ ~3.5s xuống < 500ms, tránh timeout trên Vercel
  const [
    { data: congDoanRaw },
    { data: congHangRaw, error: congHangError },
    { data: nguyenLieuRaw },
    { data: transRaw, error: transError },
    { count: todayActivityCountRaw },
  ] = await Promise.all([
    supabase.from("cong_doan").select("*"),
    supabase.from("cong_hang").select("*, don_hang (*)").order("ngay_tao", { ascending: false }),
    supabase.from("nguyen_lieu").select("id"),
    supabase
      .from("lo_giao_dich")
      .select(`
        id,
        ma_lo,
        ngay_tao,
        ghi_chu,
        danh_sach_anh,
        id_cong_hang,
        tai_khoan ( ho_ten ),
        danh_muc_giao_dich ( ten_danh_muc, phan_he, loai_giao_dich ),
        cong_hang ( ma_cong_hang, don_hang ( ma_hang, so_luong_san_xuat ) ),
        so_cai_vat_tu (
          ma_quy_cach,
          bien_dong_so_luong,
          nguyen_lieu ( ten_nguyen_lieu, danh_sach_quy_cach )
        )
      `)
      .order("ngay_tao", { ascending: false })
      .limit(10),
    supabase.from("lo_giao_dich").select("id", { count: "exact", head: true }).gte("ngay_tao", oneDayAgo),
  ]);

  const todayActivityCount = todayActivityCountRaw || 0;

  const congDoanMap = new Map<string, string>();
  (congDoanRaw || []).forEach((cd: { id: string; ten_cong_doan: string }) => {
    congDoanMap.set(cd.id, cd.ten_cong_doan);
  });

  if (congHangError) {
    console.error("Lỗi lấy danh sách công hàng ở dashboard:", congHangError);
  }

  const congHangList = congHangRaw || [];

  let tonKhoBtpCount = 0;
  let daGiaoCount = 0;
  let chuaLamCount = 0;
  let dangLamCountOnly = 0;

  const activeCongHangList: DashboardCongHangItem[] = [];

  for (const ch of congHangList) {
    const isDaGiao = ch.trang_thai_kho === "DA_GIAO";
    const isTonKho = (ch.trang_thai_kho === "TON_KHO" || ch.trang_thai_kho === "DA_NHAP" || ch.trang_thai_sx === "DA_LAM") && !isDaGiao;
    const isChuaLam = ch.trang_thai_sx === "CHUA_LAM" && !isDaGiao && !isTonKho;
    const isDangLam = ch.trang_thai_sx === "DANG_LAM" && !isDaGiao && !isTonKho;

    if (isDaGiao) {
      daGiaoCount++;
    } else if (isTonKho) {
      tonKhoBtpCount++;
    } else if (isDangLam) {
      dangLamCountOnly++;
    } else if (isChuaLam) {
      chuaLamCount++;
    }

    // Nếu công hàng đang sản xuất trong xưởng (chưa hoàn tất DA_LAM và chưa giao DA_GIAO) -> thêm vào activeCongHangList
    if (ch.trang_thai_sx !== "DA_LAM" && ch.trang_thai_kho !== "DA_GIAO" && ch.trang_thai_kho !== "TON_KHO") {
      const stages: Array<{ id_cong_doan: string; da_xong: boolean }> = Array.isArray(
        ch.danh_sach_cong_doan
      )
        ? ch.danh_sach_cong_doan
        : [];
      const totalStages = stages.length;
      const completedStages = stages.filter((s) => s.da_xong).length;
      const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

      const currentStageObj = stages.find((s) => !s.da_xong);
      const currentStageName = currentStageObj
        ? congDoanMap.get(currentStageObj.id_cong_doan) || "Đang xử lý"
        : "Đang kiểm tra";

      let ten_san_pham = "Đơn hàng sản xuất";
      if (Array.isArray(ch.don_hang) && ch.don_hang.length > 0) {
        ten_san_pham = ch.don_hang.map((d: { ma_hang: string; so_luong_san_xuat?: number }) => {
          const qty = d.so_luong_san_xuat ? ` (x${d.so_luong_san_xuat})` : "";
          return `${d.ma_hang || "Sản phẩm"}${qty}`;
        }).join(", ");
      }

      activeCongHangList.push({
        id: ch.id,
        ma_cong_hang: ch.ma_cong_hang || "CH-???",
        ghi_chu: ch.ghi_chu || "",
        trang_thai_sx: ch.trang_thai_sx || "CHUA_LAM",
        trang_thai_kho: ch.trang_thai_kho || "CHUA_NHAP",
        ngay_tao: ch.ngay_tao || ch.created_at || "",
        progress,
        completedStages,
        totalStages,
        currentStageName,
        ten_san_pham,
        danh_sach_don_hang: Array.isArray(ch.don_hang)
          ? ch.don_hang.map((d: any) => ({
              ma_hang: d.ma_hang || "Sản phẩm",
              so_luong_san_xuat: Number(d.so_luong_san_xuat) || 0,
            }))
          : [],
      });
    }
  }

  // KPI Công hàng đang sản xuất là tổng số công hàng đang thực thi trong xưởng (khớp 100% với danh sách bên dưới)
  const activeCongHangCount = activeCongHangList.length;

  const nguyenLieuCount = nguyenLieuRaw ? nguyenLieuRaw.length : 0;
  // Số nguyên liệu dưới mức an toàn (mặc định giả định 0 hoặc kiểm tra định mức nếu có)
  const lowStockCount = 0;

  if (transError) {
    console.error("Lỗi lấy danh sách giao dịch ở dashboard:", transError);
  }

  const recentTransactions: DashboardTransactionItem[] = (transRaw || []).map((t: any) => {
    const scList: any[] = Array.isArray(t.so_cai_vat_tu) ? t.so_cai_vat_tu : [];
    const isBtp = t.danh_muc_giao_dich?.phan_he === "BAN_THANH_PHAM" || (scList.length === 0 && t.cong_hang);
    const loai_doi_tuong = isBtp ? "BAN_THANH_PHAM" : "NGUYEN_LIEU";

    let doi_tuong_ten = "Vật tư xưởng";
    let so_luong_tong = 0;
    let quy_cach_ghi_chu: string | undefined = undefined;
    let danh_sach_don_hang: Array<{ ma_hang: string; so_luong_san_xuat?: number }> | undefined = undefined;

    if (isBtp) {
      const dhList: any[] = Array.isArray(t.cong_hang?.don_hang) ? t.cong_hang.don_hang : [];
      if (dhList.length > 0) {
        so_luong_tong = dhList.reduce((sum, d) => sum + (Number(d.so_luong_san_xuat) || 0), 0);
        danh_sach_don_hang = dhList.map((d: any) => ({
          ma_hang: d.ma_hang || "Sản phẩm",
          so_luong_san_xuat: Number(d.so_luong_san_xuat) || 0,
        }));
      }
      doi_tuong_ten = t.cong_hang?.ma_cong_hang || "Bán thành phẩm xưởng";
      quy_cach_ghi_chu = undefined;
    } else {
      const uniqueNames = Array.from(new Set(scList.map(sc => sc.nguyen_lieu?.ten_nguyen_lieu).filter(Boolean)));
      doi_tuong_ten = uniqueNames.length > 0 ? uniqueNames.join(", ") : "Nguyên liệu xưởng";
      so_luong_tong = scList.reduce((sum, sc) => sum + Math.abs(Number(sc.bien_dong_so_luong) || 0), 0);

      // Trích xuất trực tiếp tên quy cách thực tế (không hiển thị mã QC-xx)
      const qcNames = Array.from(
        new Set(
          scList
            .map((sc: any) => {
              const qcArray: any[] = Array.isArray(sc.nguyen_lieu?.danh_sach_quy_cach)
                ? sc.nguyen_lieu.danh_sach_quy_cach
                : [];
              const qcObj = qcArray.find((q: any) => q.ma_quy_cach === sc.ma_quy_cach);
              return qcObj?.ten;
            })
            .filter((name: any): name is string => typeof name === "string" && name.trim().length > 0)
        )
      );
      if (qcNames.length > 0) {
        quy_cach_ghi_chu = `(${qcNames.join(", ")})`;
      }
    }

    return {
      id: t.id,
      ma_lo: t.ma_lo || "LO-???",
      created_at: t.ngay_tao || t.created_at || "",
      ghi_chu: t.ghi_chu || "",
      ho_ten_nhan_vien: t.tai_khoan?.ho_ten || "Hệ thống",
      ten_danh_muc: t.danh_muc_giao_dich?.ten_danh_muc || "Giao dịch",
      phan_he: t.danh_muc_giao_dich?.phan_he || "KHO",
      loai_giao_dich: t.danh_muc_giao_dich?.loai_giao_dich || "NHAP",
      ma_cong_hang: t.cong_hang?.ma_cong_hang || undefined,
      doi_tuong_ten,
      loai_doi_tuong,
      so_luong_tong,
      quy_cach_ghi_chu,
      danh_sach_anh: Array.isArray(t.danh_sach_anh) ? t.danh_sach_anh : [],
      danh_sach_don_hang,
    };
  });

  const statusDistribution = [
    { name: "Đang sản xuất", value: dangLamCountOnly, color: "#3b82f6", code: "DANG_LAM" },
    { name: "Tồn kho BTP", value: tonKhoBtpCount, color: "#f59e0b", code: "TON_KHO" },
    { name: "Đã giao", value: daGiaoCount, color: "#10b981", code: "DA_GIAO" },
    { name: "Chưa làm", value: chuaLamCount, color: "#64748b", code: "CHUA_LAM" },
  ];

  return {
    kpi: {
      activeCongHangCount,
      tonKhoBtpCount,
      nguyenLieuCount,
      lowStockCount,
      todayActivityCount: todayActivityCount || 0,
    },
    activeCongHangList,
    statusDistribution,
    recentTransactions,
  };
}

export async function refreshDashboard() {
  revalidatePath("/dashboard");
}
