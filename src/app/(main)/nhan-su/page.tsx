import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTaiKhoan, getCongNhan } from "@/app/actions/nhan-su";
import { NhanSuClient } from "./nhan-su-client";

export default async function NhanSuPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'Quan ly') {
    redirect('/');
  }

  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || 'TAI_KHOAN';
  
  const dsTaiKhoan = await getTaiKhoan();
  const dsCongNhan = await getCongNhan();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân sự</h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản đăng nhập hệ thống và danh sách công nhân phân xưởng.
        </p>
      </div>
      
      <NhanSuClient 
        serverTab={tab} 
        taiKhoanData={dsTaiKhoan} 
        congNhanData={dsCongNhan} 
      />
    </div>
  );
}
