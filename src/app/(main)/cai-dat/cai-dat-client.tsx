"use client";

import { useState, useActionState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "next-themes";
import { updateProfile, updatePassword } from "@/app/actions/cai-dat";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Save, User, Settings as SettingsIcon, LogOut, CheckCircle2 } from "lucide-react";
import { logout } from "@/app/actions/auth";

type CaiDatTab = 'PROFILE' | 'SYSTEM';

export function CaiDatClient({ userProfile }: { userProfile: any }) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<CaiDatTab>('PROFILE');

  // Profile State
  const [avatar, setAvatar] = useState(userProfile.anh_dai_dien || '');
  
  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, null);
  const [pwdState, pwdAction, isPwdPending] = useActionState(updatePassword, null);

  useEffect(() => {
    if (profileState?.error) toast.error(profileState.error);
    if (profileState?.success) toast.success(t('common.success'));
  }, [profileState, t]);

  useEffect(() => {
    if (pwdState?.error) toast.error(pwdState.error);
    if (pwdState?.success) {
      toast.success(t('common.success'));
      (document.getElementById('pwdForm') as HTMLFormElement)?.reset();
    }
  }, [pwdState, t]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-4">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'PROFILE' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" /> {t('settings.profile')}
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'SYSTEM' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <SettingsIcon className="w-4 h-4" /> {t('settings.system')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-w-xl">
        {activeTab === 'PROFILE' && (
          <div className="flex flex-col gap-8">
            {/* Form Hồ sơ */}
            <form action={profileAction} className="flex flex-col gap-5 p-5 border rounded-xl bg-card">
              <h3 className="font-semibold text-lg border-b pb-2">Thông tin cơ bản</h3>
              <div className="flex flex-col items-center gap-2">
                <ImageUpload 
                  value={avatar} 
                  onChange={setAvatar} 
                />
                <span className="text-xs text-muted-foreground">{t('settings.avatar')}</span>
                <input type="hidden" name="anh_dai_dien" value={avatar} />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t('settings.fullname')}</label>
                <input 
                  name="ho_ten"
                  defaultValue={userProfile.ho_ten}
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t('settings.phone')}</label>
                <input 
                  name="so_dien_thoai"
                  defaultValue={userProfile.so_dien_thoai}
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isProfilePending}
                className="mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground h-10 rounded-md px-4 font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isProfilePending ? 'Đang lưu...' : t('common.save')}
              </button>
            </form>

            {/* Form Mật khẩu */}
            <form id="pwdForm" action={pwdAction} className="flex flex-col gap-5 p-5 border border-destructive/20 rounded-xl bg-card">
              <h3 className="font-semibold text-lg border-b pb-2 text-destructive">{t('settings.changePassword')}</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                <input 
                  type="password"
                  name="currentPassword"
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <input 
                  type="password"
                  name="newPassword"
                  required
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPwdPending}
                className="mt-2 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground h-10 rounded-md px-4 font-medium hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPwdPending ? 'Đang lưu...' : t('settings.changePassword')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'SYSTEM' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 p-5 border rounded-xl bg-card">
              <h3 className="font-semibold text-lg border-b pb-2">{t('settings.language')} & {t('settings.theme')}</h3>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t('settings.language')}</label>
                <select 
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-medium">{t('settings.theme')}</label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="light">{t('settings.themeLight')}</option>
                  <option value="dark">{t('settings.themeDark')}</option>
                  <option value="system">{t('settings.themeSystem')}</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 border border-destructive text-destructive h-12 rounded-xl font-medium hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" /> {t('settings.logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
