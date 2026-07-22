import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import Link from "next/link";
import { Factory } from "lucide-react";
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full pb-16 md:pb-0 h-screen overflow-y-auto relative">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
            <Factory className="h-6 w-6 text-primary" />
            <span>ITKeyBay</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <UserNav session={session} />
            <ThemeToggle />
          </div>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
