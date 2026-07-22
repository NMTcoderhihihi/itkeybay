import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { KhoClient } from "./components/kho-client"
import { getNguyenLieuList } from "@/app/actions/kho"

export const dynamic = 'force-dynamic'

export default async function KhoPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Lấy dữ liệu danh mục vật tư
  const nguyenLieuList = await getNguyenLieuList()

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-4">

      
      <KhoClient session={session} nguyenLieuList={nguyenLieuList} />
    </div>
  )
}
