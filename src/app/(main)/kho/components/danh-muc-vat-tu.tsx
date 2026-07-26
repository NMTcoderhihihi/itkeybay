"use client"

import { useState, useTransition } from "react"
import { NguyenLieu, QuyCach, createNguyenLieu, updateNguyenLieu, deleteNguyenLieu } from "@/app/actions/kho"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, X, Pencil, Trash2, Image as ImageIcon, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"

export function DanhMucVatTu({ initialData }: { initialData: NguyenLieu[] }) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'view' | 'edit'>('create')
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const openCreate = () => {
    resetForm()
    setDialogMode('create')
    setIsOpen(true)
  }

  const openView = (item: NguyenLieu) => {
    setEditingId(item.id)
    setTen(item.ten_nguyen_lieu)
    setDonVi(item.don_vi)
    setAnhMinhHoa(item.anh_minh_hoa || null)
    setQuyCachList(item.danh_sach_quy_cach || [])
    setDialogMode('view')
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
      if (dialogMode === 'edit' && editingId) {
        result = await updateNguyenLieu(editingId, payload)
      } else {
        result = await createNguyenLieu(payload)
      }

      if (result.success) {
        toast.success(dialogMode === 'edit' ? "Đã cập nhật vật tư!" : "Đã thêm vật tư mới!")
        setIsOpen(false)
        resetForm()
      } else {
        toast.error(result.error || "Có lỗi xảy ra")
      }
    })
  }

  const handleDelete = () => {
    if (!editingId) return;
    if (confirm("Bạn có chắc muốn xóa vật tư này? Điều này có thể ảnh hưởng tới các phiếu giao dịch cũ.")) {
      startTransition(async () => {
        const result = await deleteNguyenLieu(editingId)
        if (result.success) {
          toast.success("Đã xóa vật tư")
          setIsOpen(false)
          resetForm()
        } else {
          toast.error(result.error || "Không thể xóa vì đã có dữ liệu giao dịch")
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{t('inventory.materialsTitle')}</h2>
        <Button size="sm" className="gap-1" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('inventory.addMaterial')}
        </Button>
      </div>

      {/* Dạng Lưới (Grid) hiển thị vật tư */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {initialData.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden flex flex-col cursor-pointer hover:border-primary transition-colors"
            onClick={() => openView(item)}
          >
            <div className="h-32 bg-muted relative border-b">
              {item.anh_minh_hoa ? (
                <Image src={item.anh_minh_hoa} alt={item.ten_nguyen_lieu} fill className="object-contain p-1" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                </div>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight line-clamp-1" title={item.ten_nguyen_lieu}>{item.ten_nguyen_lieu}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{t('inventory.unit')}: {item.don_vi}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase">
                  {t('inventory.specsCount')} ({item.danh_sach_quy_cach?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.danh_sach_quy_cach?.map((qc, i) => (
                    <span key={i} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {qc.ten}
                    </span>
                  ))}
                  {(!item.danh_sach_quy_cach || item.danh_sach_quy_cach.length === 0) && (
                    <span className="text-[10px] text-red-500">{t('inventory.noSpecs')}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {initialData.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            {t('inventory.noMaterials')}
          </div>
        )}
      </div>

      {/* Modal / Popup Chi tiết Vật tư */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between mt-2">
            <DialogTitle>
              {dialogMode === 'create' ? t('inventory.addMaterial') : 
               dialogMode === 'edit' ? t('inventory.editMaterial') : 
               'Chi tiết Vật tư'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Thông tin chung */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                  <Label className="text-muted-foreground">{t('inventory.materialImage')}</Label>
                  {dialogMode === 'view' ? (
                    <div className="w-24 h-24 rounded-xl border bg-muted relative overflow-hidden flex items-center justify-center">
                      {anhMinhHoa ? (
                        <Image src={anhMinhHoa} alt={ten} fill className="object-contain p-1" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                      )}
                    </div>
                  ) : (
                    <ImageUpload 
                      value={anhMinhHoa}
                      onChange={setAnhMinhHoa}
                      className="w-24 h-24 rounded-xl"
                    />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{t('inventory.materialName')} {dialogMode !== 'view' && <span className="text-red-500">*</span>}</Label>
                    {dialogMode === 'view' ? (
                      <p className="font-semibold text-lg">{ten || '-'}</p>
                    ) : (
                      <Input value={ten} onChange={(e) => setTen(e.target.value)} required />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">{t('inventory.materialUnit')} {dialogMode !== 'view' && <span className="text-red-500">*</span>}</Label>
                    {dialogMode === 'view' ? (
                      <p className="font-medium">{donVi || '-'}</p>
                    ) : (
                      <Input value={donVi} onChange={(e) => setDonVi(e.target.value)} required />
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách Quy cách */}
              <div className="space-y-3 mt-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold text-muted-foreground">{t('inventory.specsList')}</Label>
                  {(dialogMode === 'create' || dialogMode === 'edit') && (
                    <Button type="button" variant="outline" size="sm" onClick={addQuyCach} className="gap-1 h-8">
                      <Plus className="h-3 w-3" /> {t('inventory.addSpec')}
                    </Button>
                  )}
                </div>
                
                {quyCachList.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    {t('inventory.noSpecsWarning')}
                  </p>
                )}

                {dialogMode === 'view' ? (
                  <div className="flex flex-col gap-2">
                    {quyCachList.map((qc, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                        <span className="font-mono text-xs px-2 py-1 bg-secondary rounded-sm">{qc.ma_quy_cach}</span>
                        <span className="font-medium">{qc.ten}</span>
                      </div>
                    ))}
                  </div>
                ) : (
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeQuyCach(index)} className="text-destructive shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t mt-6">
              <div>
                {dialogMode === 'edit' && (
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending} className="gap-2">
                    <Trash2 className="h-4 w-4" /> Xóa vật tư
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  Đóng
                </Button>
                {dialogMode === 'view' && (
                  <Button type="button" onClick={() => setDialogMode('edit')} className="gap-2">
                    <Pencil className="h-4 w-4" /> Chỉnh sửa
                  </Button>
                )}
                {(dialogMode === 'create' || dialogMode === 'edit') && (
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('inventory.saveMaterial')}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
