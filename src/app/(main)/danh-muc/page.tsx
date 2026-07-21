import { getDanhMucGiaoDich } from "@/app/actions/danh-muc";
import { DanhMucClient } from "./danh-muc-client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DanhMucPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    redirect('/');
  }

  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || 'NGUYEN_LIEU';
  const data = await getDanhMucGiaoDich();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Danh mục Giao dịch</h1>
        <p className="text-muted-foreground">
          Thiết lập các lý do nhập/xuất cho từng phân hệ trong hệ thống.
        </p>
      </div>
      
      <DanhMucClient initialData={data} serverTab={tab} />
    </div>
  );
}
