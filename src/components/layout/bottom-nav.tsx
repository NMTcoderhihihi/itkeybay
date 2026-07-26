"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Settings, 
  Users, 
  Factory, 
  LayoutDashboard,
  Box
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function BottomNav({ isManager }: { isManager: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();

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
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex w-1/4 shrink-0 flex-col items-center justify-center gap-1 transition-colors snap-center ${
              isActive
                ? "bg-primary/15 text-primary border-t-2 border-primary" 
                : "text-muted-foreground hover:text-primary hover:bg-muted/30 border-t-2 border-transparent"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
