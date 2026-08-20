import { getCongDoanList } from "@/app/actions/san-xuat"
import { ImportPageClient } from "./import-page-client"

export const metadata = {
  title: "Import Công Hàng | Hệ thống Quản lý Sản xuất",
}

export default async function ImportPage() {
  const congDoanList = await getCongDoanList()

  return (
    <div className="p-4 md:p-6 w-full">
      <ImportPageClient congDoanList={congDoanList || []} />
    </div>
  )
}
