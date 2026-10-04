import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getDanhSachDonTong } from "@/app/actions/don-tong"
import { getNguyenLieuList } from "@/app/actions/kho"
import { DonTongTab } from "./components/don-tong-client"

export const dynamic = 'force-dynamic'

export default async function DonTongPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const [donTongList, nguyenLieuList] = await Promise.all([
    getDanhSachDonTong(),
    getNguyenLieuList()
  ])

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 space-y-4">
      <div className="flex-1 overflow-auto rounded-lg border bg-background shadow-sm">
        <DonTongTab donTongList={donTongList || []} nguyenLieuList={nguyenLieuList || []} />
      </div>
    </div>
  )
}
