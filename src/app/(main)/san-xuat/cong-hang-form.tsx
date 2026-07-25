"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [maCongHang, setMaCongHang] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [donHangList, setDonHangList] = useState<ChiTietDonHang[]>([{ ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
  const [selectedCongDoan, setSelectedCongDoan] = useState<string[]>([])

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
    
    // Validate
    if (!maCongHang.trim()) return toast.error("Vui lòng nhập Mã Công Hàng")
    if (selectedCongDoan.length === 0) return toast.error("Vui lòng chọn ít nhất 1 công đoạn sản xuất")
    
    // Check donHangList valid
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
      // reset form
      setMaCongHang('')
      setGhiChu('')
      setDonHangList([{ ma_don_hang: '', ma_hang: '', so_luong_san_xuat: 1 }])
      setSelectedCongDoan([])
      window.location.reload()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" /> Tạo Công Hàng Mới
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
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Danh sách Đơn hàng con <span className="text-destructive">*</span></label>
              <Button type="button" variant="outline" size="sm" onClick={addDonHang}>
                <Plus className="h-4 w-4 mr-1" /> Thêm mã hàng
              </Button>
            </div>
            
            <div className="space-y-3">
              {donHangList.map((dh, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input 
                    placeholder="Mã Đơn hàng (VD: 1708331BRO)"
                    value={dh.ma_don_hang}
                    onChange={e => updateDonHang(index, 'ma_don_hang', e.target.value)}
                    required
                  />
                  <Input 
                    placeholder="Mã Hàng (BTP)"
                    value={dh.ma_hang}
                    onChange={e => updateDonHang(index, 'ma_hang', e.target.value)}
                    required
                  />
                  <Input 
                    type="number"
                    min={1}
                    className="w-24"
                    placeholder="SL"
                    value={dh.so_luong_san_xuat}
                    onChange={e => updateDonHang(index, 'so_luong_san_xuat', Number(e.target.value))}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive shrink-0"
                    onClick={() => removeDonHang(index)}
                    disabled={donHangList.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Chọn Công đoạn */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quy trình Công đoạn <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border p-4 rounded-lg bg-card">
              {congDoanList.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-full">Chưa có công đoạn nào được tạo. Vui lòng sang tab "Quản lý Công đoạn" để tạo trước.</p>
              ) : (
                congDoanList.map(cd => (
                  <div key={cd.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={cd.id} 
                      checked={selectedCongDoan.includes(cd.id)}
                      onCheckedChange={() => handleToggleCongDoan(cd.id)}
                    />
                    <label
                      htmlFor={cd.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cd.ten_cong_doan}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2">Hủy</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo Công Hàng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
