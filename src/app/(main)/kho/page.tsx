import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { KhoClient } from "./components/kho-client"
import { getNguyenLieuList } from "@/app/actions/kho"
import { getCongHangList } from "@/app/actions/san-xuat"
import { getTongQuanTonKho, getDanhSachDanhMuc } from "@/app/actions/giao-dich"

export const dynamic = 'force-dynamic'

export default async function KhoPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Lấy dữ liệu trên server để tránh load lại liên tục ở client
  const [nguyenLieuList, congHangList, tongQuanTonKho, danhMucList] = await Promise.all([
    getNguyenLieuList(),
    getCongHangList(),
    getTongQuanTonKho(),
    getDanhSachDanhMuc()
  ])

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-4">
      <KhoClient 
        session={session} 
        nguyenLieuList={nguyenLieuList} 
        congHangList={congHangList || []}
        tongQuanTonKho={tongQuanTonKho || []}
        danhMucList={danhMucList || []}
      />
    </div>
  )
}
