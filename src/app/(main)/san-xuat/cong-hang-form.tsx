"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createCongHang, ChiTietDonHang } from "@/app/actions/san-xuat"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type CongDoan = {
  id: string
  ten_cong_doan: string
}

export function CongHangForm({ congDoanList }: { congDoanList: CongDoan[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [maCongHang, setMaCongHang] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [donHangList, setDonHangList] = useState<ChiTietDonHang[]>([{ ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
  const [selectedCongDoan, setSelectedCongDoan] = useState<string[]>(congDoanList.map(c => c.id))

  const addDonHang = () => {
    setDonHangList([...donHangList, { ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
  }

  const removeDonHang = (index: number) => {
    if (donHangList.length <= 1) return
    const newList = [...donHangList]
    newList.splice(index, 1)
    setDonHangList(newList)
  }

  const updateDonHang = (index: number, field: keyof ChiTietDonHang, value: any) => {
    const newList = [...donHangList]
    newList[index] = { ...newList[index], [field]: value }
    setDonHangList(newList)
  }

  const handleToggleCongDoan = (id: string) => {
    if (selectedCongDoan.includes(id)) {
      setSelectedCongDoan(selectedCongDoan.filter(cd => cd !== id))
    } else {
      setSelectedCongDoan([...selectedCongDoan, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!maCongHang.trim()) return toast.error("Vui lòng nhập Mã Công Hàng")
    if (selectedCongDoan.length === 0) return toast.error("Vui lòng chọn ít nhất 1 công đoạn sản xuất")
    
    for (const dh of donHangList) {
      if (!dh.ma_don_hang.trim() || !dh.ma_hang.trim() || dh.so_luong_san_xuat <= 0) {
        return toast.error("Vui lòng nhập đầy đủ thông tin các đơn hàng con (Mã ĐH, Mã Hàng, Số lượng > 0)")
      }
    }

    setLoading(true)
    const res = await createCongHang({
      ma_cong_hang: maCongHang,
      ghi_chu: ghiChu,
      don_hang: donHangList,
      cong_doan_ids: selectedCongDoan
    })

    if (res.success) {
      toast.success("Đã tạo Công hàng mới thành công")
      setOpen(false)
      setMaCongHang('')
      setGhiChu('')
      setDonHangList([{ ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
      setSelectedCongDoan(congDoanList.map(c => c.id))
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1.5" /> {t("production.formTitle")}
      </DialogTrigger>
        <DialogContent className="max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("production.formTitle")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">{t("production.formCodeLabel")} <span className="text-destructive">*</span></label>
                <Input 
                  value={maCongHang} 
                  onChange={e => setMaCongHang(e.target.value)} 
                  placeholder={t("production.formCodePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">{t("production.formNoteLabel")}</label>
                <Input 
                  value={ghiChu} 
                  onChange={e => setGhiChu(e.target.value)} 
                  placeholder={t("production.formNotePlaceholder")}
                />
              </div>
            </div>

            {/* Đơn hàng con */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">{t("production.formOrdersLabel")} <span className="text-destructive">*</span></label>
                <Button type="button" variant="outline" size="sm" onClick={addDonHang} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> {t("production.addOrder")}
                </Button>

              </div>

              <div className="space-y-2">
                {donHangList.map((dh, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-end border p-3 rounded-lg bg-card">
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <label className="text-xs text-muted-foreground">{t("production.formOrderCodeLabel")}</label>
                      <Input 
                        value={dh.ma_don_hang} 
                        onChange={e => updateDonHang(idx, 'ma_don_hang', e.target.value)}
                        placeholder="VD: DH-001" 
                        required 
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <label className="text-xs text-muted-foreground">{t("production.formOrderNameLabel")}</label>
                      <Input 
                        value={dh.ma_hang} 
                        onChange={e => updateDonHang(idx, 'ma_hang', e.target.value)}
                        placeholder="VD: Bàn Làm Việc..." 
                        required 
                        className="h-9"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-xs text-muted-foreground">{t("production.formQtyLabel")}</label>
                      <Input 
                        type="number" 
                        min={1} 
                        value={dh.so_luong_san_xuat} 
                        onChange={e => updateDonHang(idx, 'so_luong_san_xuat', parseInt(e.target.value) || 0)} 
                        required 
                        className="h-9 font-bold text-right"
                      />
                    </div>
                    {donHangList.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeDonHang(idx)}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quy trình sản xuất & chọn công đoạn (Item 23 & Item 25) */}
            <div className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <label className="text-sm font-medium">{t("production.formStagesLabel")} <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="h-6 text-xs p-0"
                    onClick={() => setSelectedCongDoan(congDoanList.map(c => c.id))}
                  >
                    {t("production.formSelectAll")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="h-6 text-xs p-0 text-muted-foreground"
                    onClick={() => { setSelectedCongDoan([]); }}
                  >
                    {t("production.formDeselectAll")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 border rounded-lg p-3 max-h-72 overflow-y-auto bg-muted/10">
                {congDoanList.map(cd => {
                  const checked = selectedCongDoan.includes(cd.id)
                  return (
                    <label 
                      key={cd.id} 
                      className={`flex items-center space-x-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                        checked ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox 
                        checked={checked}
                        onCheckedChange={() => handleToggleCongDoan(cd.id)}
                        className="h-4 w-4"
                      />
                      <span className="truncate" title={cd.ten_cong_doan}>{cd.ten_cong_doan}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("production.formCancel")}</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("production.formSubmit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}
