import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 relative overflow-hidden">
      {/* Nền trang trí / Glassmorphism */} 
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {children}
    </div>
  )
}
