"use client"

import { useState, useEffect } from "react"
import { getTongQuanTonKho, getSoCaiChiTiet } from "@/app/actions/giao-dich"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PackageSearch, FileText, ChevronDown, TrendingUp, TrendingDown, Loader2, X, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

export function TongQuanKho() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
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
        <p className="mt-2 text-muted-foreground">{t('inventory.loadingStock')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dạng lưới hiển thị tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {inventory.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col"
            onClick={() => openLedger(item)}
          >
            <div className="h-32 bg-muted relative border-b">
              {item.anh_minh_hoa ? (
                <Image src={item.anh_minh_hoa} alt={item.ten_nguyen_lieu} fill className="object-contain p-1" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <PackageSearch className="h-10 w-10 opacity-20" />
                </div>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight line-clamp-1" title={item.ten_nguyen_lieu}>{item.ten_nguyen_lieu}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{t('inventory.unit')}: {item.don_vi}</p>
                </div>
              </div>
              
              <div className="mt-auto space-y-2">
                {item.danh_sach_quy_cach.map((qc: any, i: number) => (
                  <div key={i} className="flex flex-wrap justify-between items-center gap-1.5 text-xs border-t pt-2 first:border-0 first:pt-0">
                    <span className="text-muted-foreground line-clamp-1 flex-1 min-w-[60px]" title={qc.ten}>{qc.ten}</span>
                    <Badge variant={qc.ton_kho > 0 ? "default" : "destructive"} className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                      {qc.ton_kho} {item.don_vi}
                    </Badge>
                  </div>
                ))}
                {item.danh_sach_quy_cach.length === 0 && (
                  <p className="text-xs text-red-500 italic">{t('inventory.noSpecs')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {inventory.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            {t('inventory.noStockData')}
          </div>
        )}
      </div>

      {/* Modal hiển thị Sổ cái (Ledger) */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t('inventory.ledgerTitle')}: <span className="text-primary">{selectedItem?.ten_nguyen_lieu}</span>
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
                    <TableHead>{t('inventory.date')}</TableHead>
                    <TableHead>{t('inventory.code')}</TableHead>
                    <TableHead>{t('inventory.reason')}</TableHead>
                    <TableHead>{t('inventory.spec')}</TableHead>
                    <TableHead className="text-right">{t('inventory.change')}</TableHead>
                    <TableHead className="text-right">{t('inventory.balance')}</TableHead>
                    <TableHead className="text-center">Minh chứng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(row.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.lo_giao_dich?.ma_lo}
                      </TableCell>
                      <TableCell>
                        {row.lo_giao_dich?.danh_muc_giao_dich?.ten_danh_muc || 'Không xác định'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {selectedItem?.danh_sach_quy_cach?.find((qc: any) => qc.ma_quy_cach === row.ma_quy_cach)?.ten || row.ma_quy_cach}
                        </Badge>
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
                      <TableCell>
                        {row.lo_giao_dich?.danh_sach_anh?.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap w-16">
                            {row.lo_giao_dich.danh_sach_anh.map((url: string, i: number) => (
                              <div 
                                key={i} 
                                className="relative w-6 h-6 border rounded overflow-hidden cursor-pointer hover:border-primary"
                                onClick={() => setPreviewImage(url)}
                              >
                                <Image src={url} alt="Evidence" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground opacity-50">
                            -
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledgerData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('inventory.noHistory')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImage} 
            alt="Preview enlarged" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
