"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const [maDonTong, setMaDonTong] = useState(initialData?.ma_don_tong || "")
  const [tenDon, setTenDon] = useState(initialData?.ten_don || "")
  const [ghiChu, setGhiChu] = useState(initialData?.ghi_chu || "")
  const [chiTiet, setChiTiet] = useState<ChiTietDonTong[]>(
    initialData?.don_tong_chi_tiet?.map((ct: any) => ({
      id_nguyen_lieu: ct.id_nguyen_lieu,
      ma_quy_cach: ct.ma_quy_cach,
      so_luong_yeu_cau: ct.so_luong_yeu_cau
    })) || []
  )

  const isEdit = !!initialData

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
      let result
      if (isEdit) {
        result = await capNhatDonTong(initialData.id, { ma_don_tong: maDonTong, ten_don: tenDon, ghi_chu: ghiChu, chi_tiet: chiTiet })
      } else {
        result = await taoDonTong({ ma_don_tong: maDonTong, ten_don: tenDon, ghi_chu: ghiChu, chi_tiet: chiTiet })
      }

      if (result.success) {
        toast.success(isEdit ? t("masterOrder.successUpdate") : t("masterOrder.successCreate"))
        onOpenChange(false)
        if (!isEdit) {
          setMaDonTong("")
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Input placeholder={t("masterOrder.codePlaceholder")} value={maDonTong} onChange={e => setMaDonTong(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("masterOrder.orderNameOpt")}</Label>
              <Input placeholder={t("masterOrder.namePlaceholder")} value={tenDon} onChange={e => setTenDon(e.target.value)} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t("common.notes") || t("masterOrder.nameNote")}</Label>
            <Input placeholder={t("masterOrder.notePlaceholder")} value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">{t("masterOrder.materialDetails")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
                <Plus className="w-4 h-4 mr-2" /> Thêm dòng
              </Button>
            </div>

            <div className="space-y-3">
              {chiTiet.map((item, index) => {
                const selectedNL = nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)
                const quyCachList = selectedNL?.danh_sach_quy_cach || []

                return (
                  <Card key={index} className="overflow-visible">
                    <div className="flex p-2 justify-between items-center bg-muted/30 border-b">
                      <span className="text-sm font-medium ml-2">{t("masterOrder.row")} #{index + 1}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleRemoveRow(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("masterOrder.material")}</Label>
                        <Select value={item.id_nguyen_lieu} onValueChange={v => updateChiTiet(index, 'id_nguyen_lieu', v)}>
                          <SelectTrigger>
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
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("masterOrder.spec")}</Label>
                        <Select value={item.ma_quy_cach} onValueChange={v => updateChiTiet(index, 'ma_quy_cach', v)} disabled={!item.id_nguyen_lieu}>
                          <SelectTrigger>
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
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("masterOrder.requiredQty")} ({selectedNL?.don_vi || '...'})</Label>
                        <Input 
                          type="number" min="0" step="0.01"
                          value={item.so_luong_yeu_cau || ''}
                          onChange={e => updateChiTiet(index, 'so_luong_yeu_cau', Number(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {chiTiet.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                  Chưa có chi tiết nào.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("masterOrder.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? t("masterOrder.saveChanges") : t("masterOrder.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
