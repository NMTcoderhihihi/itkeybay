"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"
import { taoDonTong, capNhatDonTong, ChiTietDonTong } from "@/app/actions/don-tong"
import { useTranslation } from "@/hooks/use-translation"

interface FormDonTongProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nguyenLieuList: any[]
  initialData?: any | null
}

export function FormDonTong({ open, onOpenChange, nguyenLieuList, initialData }: FormDonTongProps) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()

  const [maDonTong, setMaDonTong] = useState("")
  const [tenDon, setTenDon] = useState("")
  const [ghiChu, setGhiChu] = useState("")
  const [chiTiet, setChiTiet] = useState<ChiTietDonTong[]>([])

  const isEdit = !!initialData

  useEffect(() => {
    if (open) {
      if (initialData) {
        setMaDonTong(initialData.ma_don_tong)
        setTenDon(initialData.ten_don || "")
        setGhiChu(initialData.ghi_chu || "")
        setChiTiet(initialData.don_tong_chi_tiet?.map((ct: any) => ({
          id_nguyen_lieu: ct.id_nguyen_lieu,
          ma_quy_cach: ct.ma_quy_cach,
          so_luong_yeu_cau: ct.so_luong_yeu_cau
        })) || [])
      } else {
        setMaDonTong(`DT-${new Date().getTime().toString().slice(-6)}`)
        setTenDon("")
        setGhiChu("")
        setChiTiet([])
      }
    }
  }, [open, initialData])

  const handleAddRow = () => {
    setChiTiet([...chiTiet, { id_nguyen_lieu: "", ma_quy_cach: "", so_luong_yeu_cau: 0 }])
  }

  const handleRemoveRow = (index: number) => {
    const newChiTiet = [...chiTiet]
    newChiTiet.splice(index, 1)
    setChiTiet(newChiTiet)
  }

  const updateChiTiet = (index: number, field: keyof ChiTietDonTong, value: any) => {
    const newChiTiet = [...chiTiet]
    newChiTiet[index] = { ...newChiTiet[index], [field]: value }
    if (field === 'id_nguyen_lieu') {
      newChiTiet[index].ma_quy_cach = ""
    }
    setChiTiet(newChiTiet)
  }

  const handleSubmit = () => {
    if (!maDonTong) return toast.error(t("masterOrder.errNoCode"))
    if (chiTiet.length === 0) return toast.error(t("masterOrder.errNoDetails"))

    for (const item of chiTiet) {
      if (!item.id_nguyen_lieu || !item.ma_quy_cach || item.so_luong_yeu_cau <= 0) {
        return toast.error(t("masterOrder.errInvalidDetail"))
      }
    }

    startTransition(async () => {
      const payload = { ma_don_tong: maDonTong, ten_don: tenDon, ghi_chu: ghiChu, chi_tiet: chiTiet }
      let result
      if (isEdit) {
        result = await capNhatDonTong(initialData.id, payload)
      } else {
        result = await taoDonTong(payload)
      }

      if (result.success) {
        toast.success(isEdit ? t("masterOrder.successUpdate") : t("masterOrder.successCreate"))
        onOpenChange(false)
        if (!isEdit) {
          setMaDonTong(`DT-${new Date().getTime().toString().slice(-6)}`)
          setTenDon("")
          setGhiChu("")
          setChiTiet([])
        }
      } else {
        toast.error(result.error || t("masterOrder.errorOccurred"))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 pb-0 flex-shrink-0">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("masterOrder.editTitle") : t("masterOrder.createTitle")}</DialogTitle>
            <DialogDescription>
              Tạo các yêu cầu nhập vật tư tổng thể cho các dự án lớn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("masterOrder.orderCode")}</Label>
                <Input placeholder={t("masterOrder.codePlaceholder")} value={maDonTong} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>{t("masterOrder.orderNameOpt")}</Label>
                <Input placeholder={t("masterOrder.namePlaceholder")} value={tenDon} onChange={e => setTenDon(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t("inventory.note")}</Label>
              <Input placeholder={t("masterOrder.notePlaceholder")} value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto border-t">
          <div className="p-6 pt-4">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">{t("masterOrder.materialDetails")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
                <Plus className="w-4 h-4 mr-2" /> Thêm dòng
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">STT</TableHead>
                    <TableHead>{t("masterOrder.material")}</TableHead>
                    <TableHead>{t("masterOrder.spec")}</TableHead>
                    <TableHead className="w-[150px]">{t("masterOrder.requiredQty")}</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chiTiet.map((item, index) => {
                    const selectedNL = nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)
                    const quyCachList = selectedNL?.danh_sach_quy_cach || []

                    return (
                      <TableRow key={index}>
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Select value={item.id_nguyen_lieu} onValueChange={v => updateChiTiet(index, 'id_nguyen_lieu', v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("masterOrder.selectPlaceholder")}>
                                {selectedNL?.ten_nguyen_lieu || t("masterOrder.selectPlaceholder")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {nguyenLieuList.map(nl => (
                                <SelectItem key={nl.id} value={nl.id}>{nl.ten_nguyen_lieu}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={item.ma_quy_cach} onValueChange={v => updateChiTiet(index, 'ma_quy_cach', v)} disabled={!item.id_nguyen_lieu}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("masterOrder.selectPlaceholder")}>
                                {quyCachList.find((q: any) => q.ma_quy_cach === item.ma_quy_cach)?.ten || t("masterOrder.selectPlaceholder")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {quyCachList.map((qc: any) => (
                                <SelectItem key={qc.ma_quy_cach} value={qc.ma_quy_cach}>{qc.ten}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" min="0" step="0.01"
                              value={item.so_luong_yeu_cau || ''}
                              onChange={e => updateChiTiet(index, 'so_luong_yeu_cau', Number(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-xs text-muted-foreground w-8 shrink-0">{selectedNL?.don_vi}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveRow(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {chiTiet.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {t("masterOrder.noDetailsYet")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 flex-shrink-0 border-t bg-muted/20">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("masterOrder.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? t("masterOrder.saveChanges") : t("masterOrder.create")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
