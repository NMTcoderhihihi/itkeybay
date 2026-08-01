"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { saveCongDoan, deleteCongDoan } from "@/app/actions/san-xuat"
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"

type CongDoan = {
  id: string
  ten_cong_doan: string
  ghi_chu: string
}

export function CongDoanManager({ initialData }: { initialData: CongDoan[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [data, setData] = useState<CongDoan[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ ten_cong_doan: '', ghi_chu: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ten_cong_doan.trim()) return

    setLoading(true)
    const res = await saveCongDoan({ 
      id: editingId || undefined, 
      ...formData 
    })
    
    if (res.success) {
      toast.success(editingId ? t("production.stageUpdateSuccess") : t("production.stageAddSuccess"))
      if (editingId) {
        setData(prev => prev.map(item => item.id === editingId ? (res.data || { ...item, ...formData }) : item))
      } else if (res.data) {
        setData(prev => [res.data, ...prev])
      }
      setFormData({ ten_cong_doan: '', ghi_chu: '' })
      setEditingId(null)
      setIsModalOpen(false)
      router.refresh()
    } else {
      toast.error(res.error || "Có lỗi xảy ra")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("production.stageDeleteConfirm"))) return
    setLoading(true)
    const res = await deleteCongDoan(id)
    if (res.success) {
      toast.success(t("production.stageDeleteSuccess"))
      setData(prev => prev.filter(item => item.id !== id))
      router.refresh()
    } else {
      toast.error(res.error || "Có lỗi xảy ra")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Nút Thêm Công Đoạn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-4 rounded-xl border gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight">{t("production.stageManagerTitle")}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("production.stageManagerDesc")}</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({ ten_cong_doan: '', ghi_chu: '' })
            setIsModalOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-9 px-4 text-xs sm:text-sm self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> {t("production.addStage")}
        </Button>
      </div>

      {/* Bảng Danh Mục */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">{t("production.stageName")}</TableHead>
              <TableHead className="font-bold">{t("production.stageNote")}</TableHead>
              <TableHead className="w-[100px] text-right font-bold">{t("production.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24 text-sm">
                  {t("production.stageNoData")}
                </TableCell>
              </TableRow>
            )}
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-semibold text-sm">{item.ten_cong_doan}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.ghi_chu || <span className="italic opacity-70">{t("production.stageNoNote")}</span>}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setEditingId(item.id)
                        setFormData({ ten_cong_doan: item.ten_cong_doan, ghi_chu: item.ghi_chu || '' })
                        setIsModalOpen(true)
                      }}
                      title={t("production.editOrder")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                      title={t("production.deleteOrder")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* POPUP MODAL THÊM / SỬA CÔNG ĐOẠN */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsModalOpen(false)
          setEditingId(null)
          setFormData({ ten_cong_doan: '', ghi_chu: '' })
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 bg-slate-50/50">
          <DialogHeader className="border-b pb-3 -mx-4 -mt-4 px-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 bg-background">
            <DialogTitle className="text-base sm:text-lg font-bold">
              {editingId ? t("production.stageEditTitle") : t("production.stageAddTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-1.5 block text-foreground">
                {t("production.stageName")} <span className="text-destructive">*</span>
              </label>
              <Input 
                required
                value={formData.ten_cong_doan}
                onChange={e => setFormData({...formData, ten_cong_doan: e.target.value})}
                placeholder={t("production.stageNamePlaceholder")}
                className="h-9 sm:h-10 text-xs sm:text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-semibold mb-1.5 block text-foreground">
                {t("production.stageNote")}
              </label>
              <Textarea 
                value={formData.ghi_chu}
                onChange={e => setFormData({...formData, ghi_chu: e.target.value})}
                placeholder={t("production.stageNotePlaceholder")}
                className="min-h-[80px] text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingId(null)
                  setFormData({ ten_cong_doan: '', ghi_chu: '' })
                }} 
                className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold"
              >
                {t("production.formCancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="h-8 sm:h-9 px-4 sm:px-5 text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {loading && <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                {editingId ? t("production.stageSaveLabel") : t("production.stageAddLabel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
