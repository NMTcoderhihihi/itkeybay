"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Settings, 
  Users, 
  Factory, 
  LayoutDashboard,
  Box,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";

export function Sidebar({ isManager }: { isManager: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar_collapsed", String(nextVal));
  };

  const navItems = [
    { name: t('nav.home'), href: "/dashboard", icon: LayoutDashboard, show: isManager },
    { name: t('nav.inventory'), href: "/kho", icon: Package, show: true },
    { name: t('nav.production'), href: "/san-xuat", icon: Factory, show: true },
    { name: t('nav.hr'), href: "/nhan-su", icon: Users, show: isManager },
    { name: t('nav.categories'), href: "/danh-muc", icon: Box, show: isManager },
    { name: t('nav.settings'), href: "/cai-dat", icon: Settings, show: true },
  ].filter(item => item.show);

  return (
    <aside
      className={`hidden md:flex flex-col border-r bg-muted/40 h-screen sticky top-0 transition-all duration-300 z-30 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b px-4 lg:h-[60px] ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link
          href={isManager ? "/dashboard" : "/kho"}
          className={`flex items-center gap-2 font-semibold ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="ITKeyBay"
        >
          <Factory className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && <span className="truncate">ITKeyBay</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground shrink-0"
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav
          className={`grid items-start gap-2 ${
            isCollapsed ? "px-2" : "px-2 lg:px-4"
          } text-sm font-medium`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-lg transition-all ${
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-2 flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Thu gọn</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
