import { SanXuatClient } from "./san-xuat-client"
import { getCongHangList, getCongDoanList } from "@/app/actions/san-xuat"
import { getCongNhan } from "@/app/actions/nhan-su"
import { getDanhSachDanhMuc } from "@/app/actions/giao-dich"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Sản Xuất - ITKeyBay",
}

export default async function SanXuatPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const [congHangList, congDoanList, congNhanList, danhMucList] = await Promise.all([
    getCongHangList(),
    getCongDoanList(),
    getCongNhan(),
    getDanhSachDanhMuc()
  ])

  return (
    <SanXuatClient 
      congHangList={congHangList || []} 
      congDoanList={congDoanList || []} 
      congNhanList={congNhanList || []}
      danhMucList={danhMucList || []}
      isManager={session.role === 'Quan ly'}
    />
  )
}
