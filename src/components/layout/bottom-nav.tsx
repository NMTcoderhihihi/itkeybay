import Link from "next/link";
import { 
  Package, 
  Settings, 
  Users, 
  Factory, 
  LayoutDashboard,
  Box
} from "lucide-react";
import { getSession } from "@/lib/session";

import { getDictionary } from "@/lib/i18n";

export async function BottomNav() {
  const session = await getSession();
  const isManager = session?.role === 'Quan ly';
  const { t } = await getDictionary();

  const navItems = [
    { name: t('nav.home'), href: "/dashboard", icon: LayoutDashboard, show: isManager },
    { name: t('nav.inventory'), href: "/kho", icon: Package, show: true },
    { name: t('nav.production'), href: "/san-xuat", icon: Factory, show: true },
    { name: t('nav.hr'), href: "/nhan-su", icon: Users, show: isManager },
    { name: t('nav.categories'), href: "/danh-muc", icon: Box, show: isManager },
    { name: t('nav.settings'), href: "/cai-dat", icon: Settings, show: true },
  ].filter(item => item.show);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full bg-background border-t overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex w-1/4 shrink-0 flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors snap-center"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
