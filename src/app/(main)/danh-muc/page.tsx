import { getDanhMucGiaoDich } from "@/app/actions/danh-muc";
import { DanhMucClient } from "./danh-muc-client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DanhMucPage() {
  const serverStartTime = Date.now();
  console.log('--- [Next.js] Bắt đầu Server Render: /danh-muc ---');

  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    redirect('/');
  }

  console.time('[Supabase] Tổng thời gian query Danh mục');
  const data = await getDanhMucGiaoDich();
  console.timeEnd('[Supabase] Tổng thời gian query Danh mục');

  const serverTimeMs = Date.now() - serverStartTime;
  console.log(`--- [Next.js] Hoàn tất Server Render: /danh-muc mất ${serverTimeMs}ms ---`);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Danh mục Giao dịch</h1>
        <p className="text-muted-foreground">
          Thiết lập các lý do nhập/xuất cho từng phân hệ trong hệ thống.
        </p>
      </div>
      
      <DanhMucClient initialData={data} serverTimeMs={serverTimeMs} />
    </div>
  );
}
