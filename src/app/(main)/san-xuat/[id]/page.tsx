import { getCongHangDetail, getCongDoanList } from "@/app/actions/san-xuat"
import { getCongNhan } from "@/app/actions/nhan-su"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { DetailClient } from "./detail-client"
import { supabase } from "@/lib/supabase"

export const metadata = {
  title: "Chi tiết Công hàng - ITKeyBay",
}

export default async function CongHangDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const [congHang, congDoanList, congNhanList] = await Promise.all([
    getCongHangDetail(params.id),
    getCongDoanList(),
    getCongNhan()
  ])

  if (!congHang) {
    return <div className="p-6">Không tìm thấy Công hàng này.</div>
  }

  // Lấy lịch sử phát liệu cho công hàng này
  const { data: lichSuPhatLieu } = await supabase
    .from('lo_giao_dich')
    .select(`
      id, ma_lo, ngay_tao, ghi_chu,
      tai_khoan (ho_ten),
      danh_muc_giao_dich (ten_danh_muc)
    `)
    .eq('id_cong_hang', params.id)
    .order('ngay_tao', { ascending: false })

  return (
    <DetailClient 
      congHang={congHang} 
      congDoanList={congDoanList || []} 
      congNhanList={congNhanList || []}
      lichSuPhatLieu={lichSuPhatLieu || []}
      isManager={session.role === 'Quan ly'}
    />
  )
}
