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
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Kho</h1>
        <p className="text-muted-foreground">
          Theo dõi tồn kho, tạo phiếu nhập/xuất và quản lý danh mục vật tư.
        </p>
      </div>
      
      <KhoClient session={session} nguyenLieuList={nguyenLieuList} />
    </div>
  )
}
