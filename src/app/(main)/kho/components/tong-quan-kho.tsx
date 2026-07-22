"use client"

import { useState, useEffect } from "react"
import { getTongQuanTonKho, getSoCaiChiTiet } from "@/app/actions/giao-dich"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, PackageSearch, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Image from "next/image"

export function TongQuanKho() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [ledgerData, setLedgerData] = useState<any[]>([])
  const [loadingLedger, setLoadingLedger] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const data = await getTongQuanTonKho()
    setInventory(data)
    setLoading(false)
  }

  const openLedger = async (item: any) => {
    setSelectedItem(item)
    setLoadingLedger(true)
    const data = await getSoCaiChiTiet(item.id)
    setLedgerData(data)
    setLoadingLedger(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Đang tải dữ liệu tồn kho...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dạng lưới hiển thị tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {inventory.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col"
            onClick={() => openLedger(item)}
          >
            <div className="h-32 bg-muted relative border-b">
              {item.anh_minh_hoa ? (
                <Image src={item.anh_minh_hoa} alt={item.ten_nguyen_lieu} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <PackageSearch className="h-10 w-10 opacity-20" />
                </div>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{item.ten_nguyen_lieu}</h3>
                  <p className="text-sm text-muted-foreground">ĐVT: {item.don_vi}</p>
                </div>
              </div>
              
              <div className="mt-auto space-y-2">
                {item.danh_sach_quy_cach.map((qc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm border-t pt-2 first:border-0 first:pt-0">
                    <span className="text-muted-foreground">{qc.ten}</span>
                    <Badge variant={qc.ton_kho > 0 ? "default" : "destructive"}>
                      {qc.ton_kho} {item.don_vi}
                    </Badge>
                  </div>
                ))}
                {item.danh_sach_quy_cach.length === 0 && (
                  <p className="text-xs text-red-500 italic">Chưa định nghĩa quy cách</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {inventory.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Chưa có dữ liệu tồn kho.
          </div>
        )}
      </div>

      {/* Modal hiển thị Sổ cái (Ledger) */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Sổ cái Kế toán Vật tư: <span className="text-primary">{selectedItem?.ten_nguyen_lieu}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-2">
            {loadingLedger ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày Giao dịch</TableHead>
                    <TableHead>Mã Phiếu</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Quy cách</TableHead>
                    <TableHead className="text-right">Biến động</TableHead>
                    <TableHead className="text-right">Tồn cuối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(row.ngay_tao), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.lo_giao_dich?.ma_lo}
                      </TableCell>
                      <TableCell>
                        {row.lo_giao_dich?.danh_muc_giao_dich?.ten_danh_muc || 'Không xác định'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.ma_quy_cach}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${row.bien_dong_so_luong > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.bien_dong_so_luong > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="font-bold">{row.bien_dong_so_luong > 0 ? '+' : ''}{row.bien_dong_so_luong}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {row.ton_kho_hien_tai}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledgerData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Chưa có lịch sử giao dịch nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
