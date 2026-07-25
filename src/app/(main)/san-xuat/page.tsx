import { SanXuatClient } from "./san-xuat-client"
import { getCongHangList, getCongDoanList } from "@/app/actions/san-xuat"
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

  const [congHangList, congDoanList] = await Promise.all([
    getCongHangList(),
    getCongDoanList()
  ])

  return (
    <SanXuatClient 
      congHangList={congHangList || []} 
      congDoanList={congDoanList || []} 
    />
  )
}
