import { getCongHangDetail, getCongDoanList, getLichSuPhatLieu } from "@/app/actions/san-xuat"
import { getCongNhan } from "@/app/actions/nhan-su"
import { getDanhMucGiaoDich } from "@/app/actions/danh-muc"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { CongHangDetailView } from "../components/cong-hang-detail-view"

export const metadata = {
  title: "Chi tiết Công hàng - ITKeyBay",
}

export default async function CongHangDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession()
  if (!session) redirect('/login')

  const [congHang, congDoanList, congNhanList, danhMucList] = await Promise.all([
    getCongHangDetail(id),
    getCongDoanList(),
    getCongNhan(),
    getDanhMucGiaoDich()
  ])

  if (!congHang) {
    return <div className="p-6">Không tìm thấy Công hàng này.</div>
  }

  const lichSuPhatLieu = await getLichSuPhatLieu(id)

  return (
    <div className="p-2 sm:p-6 w-full max-w-7xl mx-auto">
      <CongHangDetailView 
        initialCongHang={congHang} 
        congDoanList={congDoanList || []} 
        congNhanList={congNhanList || []}
        danhMucList={danhMucList || []}
        lichSuPhatLieu={lichSuPhatLieu || []}
        isManager={session.role === 'Quan ly'}
        isPopup={false}
      />
    </div>
  )
}
