"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/app/actions/auth"
import { LogOut, User, Globe } from "lucide-react"
import { SessionPayload } from "@/lib/session"
import Link from "next/link"
import { useTranslation } from "@/hooks/use-translation"

export function UserNav({ session }: { session: SessionPayload }) {
  const { t, locale, setLocale } = useTranslation();

  const cycleLanguage = () => {
    if (locale === 'vi') setLocale('zh');
    else if (locale === 'zh') setLocale('en');
    else setLocale('vi');
  };

  const getLanguageLabel = () => {
    if (locale === 'vi') return 'Tiếng Việt';
    if (locale === 'zh') return '中文';
    return 'English';
  };

  return (
    <div className="flex items-center gap-3 relative group">
      <div className="text-right flex flex-col justify-center max-w-[140px] sm:max-w-none">
        <p className="text-sm font-medium leading-none truncate">{session.name}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{session.phone}</p>
      </div>
      
      {/* Nút bấm để mở dropdown (Dùng tabindex để hỗ trợ focus trên di động) */}
      <button 
        tabIndex={0}
        className="focus:outline-none rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
      >
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={session.avatar || ''} alt={session.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {session.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown Menu CSS-only (Hiện khi hover hoặc khi button được focus) */}
      <div className="absolute top-12 right-0 w-56 z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="px-2 py-1.5 text-sm font-medium border-b bg-muted/20">
          <div className="flex flex-col space-y-1">
            <p className="leading-none truncate">{session.name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{session.role}</p>
          </div>
        </div>
        <div className="p-1 flex flex-col gap-1">
          <Link href="/cai-dat" className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>{t('settings.profile')}</span>
          </Link>

          <button onClick={cycleLanguage} className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
            <Globe className="mr-2 h-4 w-4" />
            <span>Ngôn ngữ: {getLanguageLabel()}</span>
          </button>
          
          <div className="h-px bg-muted my-1"></div>

          {/* Sử dụng Form thuần để Server Action tự động fallback nếu mất JS */}
          <form action={logout} className="w-full">
            <button 
              type="submit"
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-destructive/20 text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('settings.logout')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
