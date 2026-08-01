"use client"

import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Play, Package, Truck, User } from "lucide-react"
import Link from "next/link"
import { 
  startCongHang, 
  completeCongHang, 
  updateCongDoanProgress,
  deleteCongHang 
} from "@/app/actions/san-xuat"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useTranslation } from "@/hooks/use-translation"

export function DetailClient({ 
  congHang, 
  congDoanList,
  congNhanList,
  lichSuPhatLieu,
  isManager
}: { 
  congHang: any
  congDoanList: any[]
  congNhanList: any[]
  lichSuPhatLieu: any[]
  isManager: boolean
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [danhSachCongDoan, setDanhSachCongDoan] = useState<any[]>(congHang.danh_sach_cong_doan || [])

  const totalSteps = danhSachCongDoan.length
  const completedSteps = danhSachCongDoan.filter(cd => cd.da_xong).length
  const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)

  const handleUpdateProgress = async (index: number, field: string, value: any) => {
    const newList = [...danhSachCongDoan]
    newList[index] = { ...newList[index], [field]: value }
    if (field === 'da_xong') {
      newList[index].ngay_cap_nhat = value ? new Date().toISOString() : null
    }
    setDanhSachCongDoan(newList)
    
    // Auto save
    await updateCongDoanProgress(congHang.id, newList)
  }

  const handleStart = async () => {
    setLoading(true)
    const res = await startCongHang(congHang.id)
    if (res.success) toast.success(t("production.detailStartSuccess"))
    else toast.error(res.error)
    setLoading(false)
  }

  const handleComplete = async () => {
    if (completedSteps < totalSteps && !confirm(t("production.detailCompleteConfirm"))) return
    setLoading(true)
    const res = await completeCongHang(congHang.id)
    if (res.success) {
      toast.success(t("production.detailCompleteSuccess"))
    }
    else toast.error(res.error)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(t("production.detailDeleteConfirm"))) return
    setLoading(true)
    const res = await deleteCongHang(congHang.id)
    if (res.success) {
      toast.success(t("production.detailDeleteSuccess"))
      router.push('/san-xuat')
    } else {
      toast.error(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/san-xuat" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("production.detailTitle")}: {congHang.ma_cong_hang}</h1>
            <p className="text-muted-foreground text-sm">
              {t("production.detailCreatedAt")}: {format(new Date(congHang.ngay_tao), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {congHang.trang_thai_sx === 'CHUA_LAM' && (
            <Button onClick={handleStart} disabled={loading}><Play className="mr-2 h-4 w-4" /> {t("production.detailStartBtn")}</Button>
          )}
          {congHang.trang_thai_sx === 'DANG_LAM' && (
            <>
              <Link href={`/kho`} className={`${buttonVariants({ variant: "outline" })} border-primary text-primary`}>
                <Truck className="mr-2 h-4 w-4" /> {t("production.detailIssueBtn")}
              </Link>
              {isManager && (
                <Button onClick={handleComplete} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t("production.detailCompleteBtn")}
                </Button>
              )}
            </>
          )}
          {congHang.trang_thai_sx === 'DA_LAM' && (
            <Badge className="bg-green-600 text-base py-1.5 px-4"><CheckCircle2 className="mr-2 h-4 w-4" /> {t("production.detailDoneStatus")}</Badge>
          )}
          {isManager && congHang.trang_thai_sx === 'CHUA_LAM' && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{t("production.detailDeleteBtn")}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cột 1: Thông tin & Tiến độ */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("production.detailProductionProgress")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("production.detailCompletedSteps")} {completedSteps}/{totalSteps} {t("production.steps")}</span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Package className="mr-2 h-5 w-5 text-muted-foreground" />
                {t("production.detailSubOrders")} ({congHang.don_hang.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {congHang.don_hang.map((dh: any) => (
                  <div key={dh.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{dh.ma_don_hang}</div>
                      <div className="text-xs text-muted-foreground">{t("production.detailProductCode")}: {dh.ma_hang}</div>
                    </div>
                    <div className="font-semibold text-lg text-primary">x{dh.so_luong_san_xuat}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột 2: Phân công Công đoạn */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center">
              <User className="mr-2 h-5 w-5 text-muted-foreground" />
              {t("production.detailTaskAssign")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {danhSachCongDoan.map((cd, index) => {
                const congDoanInfo = congDoanList.find(c => c.id === cd.id_cong_doan)
                return (
                  <div key={index} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${cd.da_xong ? 'bg-green-50/50' : 'hover:bg-muted/30'}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <input 
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                          checked={cd.da_xong}
                          onChange={e => handleUpdateProgress(index, 'da_xong', e.target.checked)}
                          disabled={congHang.trang_thai_sx !== 'DANG_LAM'}
                        />
                      </div>
                      <div>
                        <div className={`font-medium ${cd.da_xong ? 'text-green-700 line-through opacity-70' : ''}`}>
                          {congDoanInfo?.ten_cong_doan || t("production.historyNoData")}
                        </div>
                        {cd.ngay_cap_nhat && (
                          <div className="text-xs text-muted-foreground">
                            {t("production.detailMarkedDone")}: {format(new Date(cd.ngay_cap_nhat), 'dd/MM HH:mm', { locale: vi })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-72 shrink-0">
                      <select
                        className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 disabled:opacity-50"
                        value={cd.id_cong_nhan || ""}
                        onChange={e => handleUpdateProgress(index, 'id_cong_nhan', e.target.value)}
                        disabled={congHang.trang_thai_sx === 'DA_LAM'}
                      >
                        <option value="">{t("production.detailAssignWorker")}</option>
                        {congNhanList.map(cn => (
                          <option key={cn.id} value={cn.id}>{cn.ho_ten} - {cn.vai_tro || t("production.worker")} ({cn.ma_cong_nhan})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
              {danhSachCongDoan.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">{t("production.detailNoStages")}</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Lịch sử phát liệu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("production.detailMaterialHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lichSuPhatLieu.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("production.detailNoMaterial")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">{t("production.detailBatchCode")}</th>
                    <th className="px-4 py-3">{t("production.timeLabel")}</th>
                    <th className="px-4 py-3">{t("production.detailCreator")}</th>
                    <th className="px-4 py-3">{t("production.detailCategory")}</th>
                    <th className="px-4 py-3">{t("production.note")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lichSuPhatLieu.map((phieu: any) => (
                    <tr key={phieu.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-primary">
                        <Link href={`/kho?lo_id=${phieu.id}`} className="hover:underline">{phieu.ma_lo}</Link>
                      </td>
                      <td className="px-4 py-3">{format(new Date(phieu.ngay_tao), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-4 py-3">{phieu.tai_khoan?.ho_ten}</td>
                      <td className="px-4 py-3">{phieu.danh_muc_giao_dich?.ten_danh_muc}</td>
                      <td className="px-4 py-3">{phieu.ghi_chu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
