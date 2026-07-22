import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { GlobalConfirmDialog } from "@/components/ui/global-confirm-dialog";

import { ProgressProvider } from "@/components/providers/progress-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Xưởng (ITKeyBay)",
  description: "Phần mềm quản lý kho và sản xuất",
};

import { cookies } from "next/headers";
import { I18nProvider } from "@/components/providers/i18n-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider defaultLocale={locale}>
            <ProgressProvider />
            {children}
            <Toaster richColors position="top-center" />
            <GlobalConfirmDialog />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
