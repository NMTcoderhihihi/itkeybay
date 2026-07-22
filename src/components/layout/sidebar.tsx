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

export async function Sidebar() {
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
    <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40 h-screen sticky top-0">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Factory className="h-6 w-6" />
          <span>ITKeyBay</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
