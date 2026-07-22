"use client"

import { useState, useTransition } from "react"
import { NguyenLieu, QuyCach, createNguyenLieu, updateNguyenLieu, deleteNguyenLieu } from "@/app/actions/kho"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X, Pencil, Trash2, Image as ImageIcon, Loader2 } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"
import { toast } from "sonner"
import Image from "next/image"

export function DanhMucVatTu({ initialData }: { initialData: NguyenLieu[] }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [ten, setTen] = useState("")
  const [donVi, setDonVi] = useState("")
  const [anhMinhHoa, setAnhMinhHoa] = useState<string | null>(null)
  const [quyCachList, setQuyCachList] = useState<QuyCach[]>([])

  const resetForm = () => {
    setEditingId(null)
    setTen("")
    setDonVi("")
    setAnhMinhHoa(null)
    setQuyCachList([])
  }

  const openEdit = (item: NguyenLieu) => {
    setEditingId(item.id)
    setTen(item.ten_nguyen_lieu)
    setDonVi(item.don_vi)
    setAnhMinhHoa(item.anh_minh_hoa || null)
    setQuyCachList(item.danh_sach_quy_cach || [])
    setIsOpen(true)
  }

  const addQuyCach = () => {
    setQuyCachList([...quyCachList, { ma_quy_cach: "", ten: "" }])
  }

  const updateQuyCach = (index: number, field: 'ma_quy_cach' | 'ten', value: string) => {
    const newList = [...quyCachList]
    newList[index][field] = value
    setQuyCachList(newList)
  }

  const removeQuyCach = (index: number) => {
    const newList = [...quyCachList]
    newList.splice(index, 1)
    setQuyCachList(newList)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ten || !donVi) {
      toast.error("Vui lòng nhập Tên và Đơn vị")
      return
    }
    
    // Validate quy cách
    for (const qc of quyCachList) {
      if (!qc.ma_quy_cach || !qc.ten) {
        toast.error("Mã và Tên quy cách không được để trống")
        return
      }
    }

    startTransition(async () => {
      const payload = {
        ten_nguyen_lieu: ten,
        don_vi: donVi,
        anh_minh_hoa: anhMinhHoa,
        danh_sach_quy_cach: quyCachList
      }

      let result;
      if (editingId) {
        result = await updateNguyenLieu(editingId, payload)
      } else {
        result = await createNguyenLieu(payload)
      }

      if (result.success) {
        toast.success(editingId ? "Đã cập nhật vật tư!" : "Đã thêm vật tư mới!")
        setIsOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Có lỗi xảy ra")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa vật tư này? Điều này có thể ảnh hưởng tới các phiếu giao dịch cũ.")) {
      startTransition(async () => {
        const result = await deleteNguyenLieu(id)
        if (result.success) {
          toast.success("Đã xóa vật tư")
        } else {
          toast.error(result.error || "Không thể xóa vì đã có dữ liệu giao dịch")
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh mục Vật tư & Quy cách</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger render={
            <Button size="sm" className="gap-1" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Thêm Vật tư
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Sửa Vật tư" : "Thêm Vật tư mới"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="flex flex-col gap-4">
                {/* Hàng 1: Ảnh minh họa (Bên trái) và Tên, Đơn vị (Bên phải) */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Label>Ảnh minh họa</Label>
                    <CldUploadWidget
                      uploadPreset="itkeybay_preset"
                      onSuccess={(result: any) => {
                        setAnhMinhHoa(result.info.secure_url);
                      }}
                    >
                      {({ open }) => (
                        <div 
                          onClick={() => open()} 
                          className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent transition-colors overflow-hidden"
                        >
                          {anhMinhHoa ? (
                            <Image src={anhMinhHoa} alt="Minh họa" width={96} height={96} className="object-cover w-full h-full" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </CldUploadWidget>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="space-y-1.5">
                      <Label>Tên Vật tư <span className="text-red-500">*</span></Label>
                      <Input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="VD: Gỗ Sồi" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Đơn vị tính <span className="text-red-500">*</span></Label>
                      <Input value={donVi} onChange={(e) => setDonVi(e.target.value)} placeholder="VD: Khối, Tấm" required />
                    </div>
                  </div>
                </div>

                {/* Hàng 2: Mảng Quy cách */}
                <div className="space-y-3 mt-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Danh sách Quy cách</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuyCach} className="gap-1 h-8">
                      <Plus className="h-3 w-3" /> Thêm QC
                    </Button>
                  </div>
                  
                  {quyCachList.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      Chưa có quy cách nào. Hãy thêm ít nhất 1 quy cách để có thể nhập/xuất kho.
                    </p>
                  )}

                  <div className="space-y-2">
                    {quyCachList.map((qc, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          placeholder="Mã QC (VD: 2x4)" 
                          value={qc.ma_quy_cach} 
                          onChange={(e) => updateQuyCach(index, 'ma_quy_cach', e.target.value)} 
                          className="flex-1"
                        />
                        <Input 
                          placeholder="Tên hiển thị (VD: 2x4 inch)" 
                          value={qc.ten} 
                          onChange={(e) => updateQuyCach(index, 'ten', e.target.value)} 
                          className="flex-[2]"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuyCach(index)} className="text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu Vật tư
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dạng Lưới (Grid) hiển thị vật tư */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {initialData.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col">
            <div className="h-32 bg-muted relative border-b">
              {item.anh_minh_hoa ? (
                <Image src={item.anh_minh_hoa} alt={item.ten_nguyen_lieu} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                </div>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{item.ten_nguyen_lieu}</h3>
                  <p className="text-sm text-muted-foreground">Đơn vị: {item.don_vi}</p>
                </div>
                <div className="flex gap-1 -mt-1 -mr-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
                  Quy cách ({item.danh_sach_quy_cach?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.danh_sach_quy_cach?.map((qc, i) => (
                    <span key={i} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {qc.ten}
                    </span>
                  ))}
                  {(!item.danh_sach_quy_cach || item.danh_sach_quy_cach.length === 0) && (
                    <span className="text-xs text-red-500">Chưa có quy cách</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialData.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Chưa có vật tư nào trong hệ thống.
          </div>
        )}
      </div>
    </div>
  )
}
