"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ten_cong_doan.trim()) return

    setLoading(true)
    const res = await saveCongDoan({ 
      id: editingId || undefined, 
      ...formData 
    })
    
    if (res.success) {
      toast.success(editingId ? t('messages.updateSuccess') : t('messages.createSuccess'))
      setFormData({ ten_cong_doan: '', ghi_chu: '' })
      setEditingId(null)
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirmDelete'))) return
    setLoading(true)
    const res = await deleteCongDoan(id)
    if (res.success) {
      toast.success(t('messages.deleteSuccess'))
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-medium mb-4">{editingId ? "Sửa Công Đoạn" : "Thêm Công Đoạn Mới"}</h3>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Tên công đoạn</label>
            <Input 
              required
              value={formData.ten_cong_doan}
              onChange={e => setFormData({...formData, ten_cong_doan: e.target.value})}
              placeholder="VD: Cưa, Bào, Sơn..."
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Ghi chú</label>
            <Input 
              value={formData.ghi_chu}
              onChange={e => setFormData({...formData, ghi_chu: e.target.value})}
              placeholder="Mô tả ngắn gọn..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Cập nhật" : "Thêm mới"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => {
                setEditingId(null)
                setFormData({ ten_cong_doan: '', ghi_chu: '' })
              }}>Hủy</Button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên công đoạn</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            )}
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.ten_cong_doan}</TableCell>
                <TableCell>{item.ghi_chu}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingId(item.id)
                        setFormData({ ten_cong_doan: item.ten_cong_doan, ghi_chu: item.ghi_chu || '' })
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
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
    </div>
  )
}
