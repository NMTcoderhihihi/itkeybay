import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTaiKhoan, getCongNhan } from "@/app/actions/nhan-su";
import { NhanSuClient } from "./nhan-su-client";

export default async function NhanSuPage() {
  const serverStartTime = Date.now();
  console.log('--- [Next.js] Bắt đầu Server Render: /nhan-su ---');

  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    redirect('/');
  }

  console.time('[Supabase] Tổng thời gian query Tài khoản & Công nhân');
  const [dsTaiKhoan, dsCongNhan] = await Promise.all([
    getTaiKhoan(),
    getCongNhan()
  ]);
  console.timeEnd('[Supabase] Tổng thời gian query Tài khoản & Công nhân');

  const serverTimeMs = Date.now() - serverStartTime;
  console.log(`--- [Next.js] Hoàn tất Server Render: /nhan-su mất ${serverTimeMs}ms ---`);

  return (
    <div className="flex flex-col h-full">

      
      <NhanSuClient 
        taiKhoanData={dsTaiKhoan} 
        congNhanData={dsCongNhan} 
        serverTimeMs={serverTimeMs}
      />
    </div>
  );
}
