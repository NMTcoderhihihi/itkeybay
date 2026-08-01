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

export function Sidebar({ isManager }: { isManager: boolean }) {
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
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40 h-screen sticky top-0">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href={isManager ? "/dashboard" : "/kho"} className="flex items-center gap-2 font-semibold">
          <Factory className="h-6 w-6 text-primary" />
          <span>ITKeyBay</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
