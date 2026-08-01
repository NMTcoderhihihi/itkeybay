"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createCongHang, ChiTietDonHang } from "@/app/actions/san-xuat"
import { Loader2, Plus, Trash2, Sparkles, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QuyTrinhManagerModal, useQuyTrinhList, QuyTrinh } from "./components/quy-trinh-manager-modal"
import { Badge } from "@/components/ui/badge"

type CongDoan = {
  id: string
  ten_cong_doan: string
}

const MAU_DON_HANG = [
  { ma_don_hang: "DH-2026-001", ma_hang: "Bàn Làm Việc Gỗ Sồi 1m4", so_luong_san_xuat: 50 },
  { ma_don_hang: "DH-2026-002", ma_hang: "Tủ Quần Áo 3 Buồng", so_luong_san_xuat: 30 },
  { ma_don_hang: "DH-2026-003", ma_hang: "Ghế Sofa Chân Gỗ", so_luong_san_xuat: 100 },
  { ma_don_hang: "DH-2026-004", ma_hang: "Kệ Sách Trang Trí 5 Tầng", so_luong_san_xuat: 75 },
]

export function CongHangForm({ congDoanList }: { congDoanList: CongDoan[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [maCongHang, setMaCongHang] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [donHangList, setDonHangList] = useState<ChiTietDonHang[]>([{ ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
  const [selectedCongDoan, setSelectedCongDoan] = useState<string[]>(congDoanList.map(c => c.id))
  const [selectedQuyTrinhId, setSelectedQuyTrinhId] = useState<string>('')

  const { quyTrinhList } = useQuyTrinhList(congDoanList.map(c => c.id))

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

  const selectMauDonHang = (index: number, mau: typeof MAU_DON_HANG[0]) => {
    const newList = [...donHangList]
    newList[index] = {
      ma_don_hang: mau.ma_don_hang,
      ma_hang: mau.ma_hang,
      so_luong_san_xuat: mau.so_luong_san_xuat
    }
    setDonHangList(newList)
    toast.success(`Đã chọn đơn hàng ${mau.ma_don_hang} - Tự động điền SL: ${mau.so_luong_san_xuat}`)
  }

  const applyQuyTrinh = (qt: QuyTrinh) => {
    setSelectedQuyTrinhId(qt.id)
    setSelectedCongDoan(qt.cong_doan_ids)
    toast.success(`Đã chọn quy trình: ${qt.ten_quy_trinh} (${qt.ma_quy_trinh}) - Tự động tick đúng ${qt.cong_doan_ids.length} công đoạn`)
  }

  const handleToggleCongDoan = (id: string) => {
    setSelectedQuyTrinhId('')
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
      setSelectedQuyTrinhId('')
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <QuyTrinhManagerModal 
        congDoanList={congDoanList} 
        onSelectQuyTrinh={applyQuyTrinh} 
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo Công Hàng Mới
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Công Hàng Mới</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">Mã Công Hàng <span className="text-destructive">*</span></label>
                <Input 
                  value={maCongHang} 
                  onChange={e => setMaCongHang(e.target.value)} 
                  placeholder="VD: 26V009-T83525..."
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">Ghi chú</label>
                <Input 
                  value={ghiChu} 
                  onChange={e => setGhiChu(e.target.value)} 
                  placeholder="Thông tin thêm..."
                />
              </div>
            </div>

            {/* Đơn hàng con */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Danh Sách Đơn Hàng / Sản Phẩm <span className="text-destructive">*</span></label>
                <Button type="button" variant="outline" size="sm" onClick={addDonHang} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Thêm đơn hàng
                </Button>
              </div>

              {/* Nút chọn nhanh từ đơn mẫu (Item 25) */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-muted/30 border">
                <span className="text-[11px] font-semibold text-muted-foreground mr-1">Chọn mẫu nhanh (Tự điền SL):</span>
                {MAU_DON_HANG.map(mau => (
                  <Button
                    key={mau.ma_don_hang}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2 bg-background hover:bg-primary/10 hover:text-primary"
                    onClick={() => selectMauDonHang(0, mau)}
                  >
                    {mau.ma_don_hang}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                {donHangList.map((dh, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-end border p-3 rounded-lg bg-card">
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <label className="text-xs text-muted-foreground">Mã Đơn Hàng</label>
                      <Input 
                        value={dh.ma_don_hang} 
                        onChange={e => updateDonHang(idx, 'ma_don_hang', e.target.value)}
                        placeholder="VD: DH-001" 
                        required 
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <label className="text-xs text-muted-foreground">Mã Hàng / Tên Sản Phẩm</label>
                      <Input 
                        value={dh.ma_hang} 
                        onChange={e => updateDonHang(idx, 'ma_hang', e.target.value)}
                        placeholder="VD: Bàn Làm Việc..." 
                        required 
                        className="h-9"
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <label className="text-xs text-muted-foreground">Số Lượng</label>
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
                <label className="text-sm font-medium">Quy Trình & Công Đoạn Sản Xuất <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="h-6 text-xs p-0"
                    onClick={() => setSelectedCongDoan(congDoanList.map(c => c.id))}
                  >
                    Chọn tất cả
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="h-6 text-xs p-0 text-muted-foreground"
                    onClick={() => { setSelectedCongDoan([]); setSelectedQuyTrinhId(''); }}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>

              {/* Lọc theo quy trình sẵn có */}
              {quyTrinhList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5" /> Áp dụng Quy trình:
                  </span>
                  {quyTrinhList.map(qt => {
                    const isSelected = selectedQuyTrinhId === qt.id;
                    return (
                      <Button
                        key={qt.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 rounded-full"
                        onClick={() => applyQuyTrinh(qt)}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        {qt.ten_quy_trinh} ({qt.ma_quy_trinh})
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 border rounded-lg p-3 max-h-56 overflow-y-auto bg-muted/10">
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
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo Công Hàng
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
