"use client"
import { useTranslation } from "@/hooks/use-translation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Button, buttonVariants } from "@/components/ui/button"

export function BanThanhPhamList({ congHangList }: { congHangList: any[] }) {
  const { t } = useTranslation();
  // Chỉ lấy những công hàng đã làm xong và đang ở trạng thái kho TON_KHO hoặc DA_GIAO
  const banThanhPham = congHangList.filter(ch => ch.trang_thai_kho === 'TON_KHO' || ch.trang_thai_kho === 'DA_GIAO')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banThanhPham.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg bg-card">
            Chưa có Bán thành phẩm nào trong kho.
          </div>
        ) : (
          banThanhPham.map(ch => {
            const totalProducts = ch.don_hang?.reduce((acc: number, curr: any) => acc + curr.so_luong_san_xuat, 0) || 0

            return (
              <Card key={ch.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate" title={ch.ma_cong_hang}>
                      {ch.ma_cong_hang}
                    </CardTitle>
                    {ch.trang_thai_kho === 'TON_KHO' ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600">Tồn kho</Badge>
                    ) : (
                      <Badge className="bg-green-600 hover:bg-green-700">Đã giao</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ngày nhập: {ch.ngay_hoan_thanh ? format(new Date(ch.ngay_hoan_thanh), 'dd/MM/yyyy HH:mm', { locale: vi }) : '---'}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Package className="h-4 w-4 mr-2" />
                    <span>{ch.don_hang?.length || 0} Đơn hàng ({totalProducts} SP)</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Link href={`/san-xuat/${ch.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Chi tiết CH
                    </Link>
                    
                    {ch.trang_thai_kho === 'TON_KHO' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => alert("")}>
                        <Truck className="h-4 w-4 mr-2" /> Giao hàng
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
