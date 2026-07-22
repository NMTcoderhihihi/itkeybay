import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CaiDatClient } from "./cai-dat-client";
import { getDictionary } from "@/lib/i18n";

export default async function CaiDatPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const { t } = await getDictionary();

  // Lấy dữ liệu cá nhân mới nhất
  const { data: userProfile } = await supabase
    .from('tai_khoan')
    .select('id, ho_ten, so_dien_thoai, anh_dai_dien')
    .eq('id', session.id)
    .single();

  if (!userProfile) redirect('/');

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin cá nhân và tùy chỉnh hệ thống.
        </p>
      </div>
      
      <CaiDatClient userProfile={userProfile} />
    </div>
  );
}
