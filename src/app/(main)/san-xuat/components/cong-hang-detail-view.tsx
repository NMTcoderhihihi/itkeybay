"use client"

import { useState, useMemo } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Factory, Package, ListTodo, CheckCircle2, Play, Truck, X, Loader2, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { 
  startCongHang, 
  completeCongHang, 
  updateCongDoanProgress,
  updateCongHangDetails,
  deleteCongHang
} from "@/app/actions/san-xuat"
import { xuatBanThanhPham } from "@/app/actions/giao-dich"
import { toast } from "sonner"
import Image from "next/image"
import { useRouter } from "next/navigation"

export interface CongHangDetailViewProps {
  initialCongHang: any
  congDoanList: any[]
  congNhanList: any[]
  danhMucList: any[]
  lichSuPhatLieu: any[]
  isManager: boolean
  onClose?: () => void
  isPopup?: boolean
}

export function CongHangDetailView({
  initialCongHang,
  congDoanList,
  congNhanList,
  danhMucList,
  lichSuPhatLieu,
  isManager,
  onClose,
  isPopup = false
}: CongHangDetailViewProps) {
  const router = useRouter()
  const { t } = useTranslation()

  // Local state
  const [congHang, setCongHang] = useState<any>(initialCongHang)
  const [danhSachCongDoan, setDanhSachCongDoan] = useState<any[]>(initialCongHang.danh_sach_cong_doan || [])
  const [loadingAction, setLoadingAction] = useState(false)
  
  // Edit mode state
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [editGhiChu, setEditGhiChu] = useState(initialCongHang.ghi_chu || "")
  const [editDonHang, setEditDonHang] = useState<any[]>(initialCongHang.don_hang || [])
  const [showStageUploadForIndex, setShowStageUploadForIndex] = useState<number | null>(null)
  
  // Final Completion State
  const [showFinalUpload, setShowFinalUpload] = useState(false)
  const [finalImages, setFinalImages] = useState<string[]>([])
  
  // Giao Hang (Xuất BTP) State
  const [showGiaoHangModal, setShowGiaoHangModal] = useState(false)
  const [selectedDanhMucXuat, setSelectedDanhMucXuat] = useState("")
  const [giaoHangImages, setGiaoHangImages] = useState<string[]>([])
  const [giaoHangGhiChu, setGiaoHangGhiChu] = useState("")
  
  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const congDoanMap = useMemo(() => {
    const map = new Map<string, string>()
    congDoanList.forEach(cd => map.set(cd.id, cd.ten_cong_doan))
    return map
  }, [congDoanList])

  const totalSteps = danhSachCongDoan.length
  const completedSteps = danhSachCongDoan.filter(cd => cd.da_xong).length
  const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)
  const isAllStepsCompleted = totalSteps > 0 && completedSteps === totalSteps

  // ACTION HANDLERS
  const handleUpdateProgress = async (index: number, updates: any) => {
    const newList = [...danhSachCongDoan]
    newList[index] = { ...newList[index], ...updates }
    if (updates.da_xong !== undefined) {
      newList[index].ngay_cap_nhat = updates.da_xong ? new Date().toISOString() : null
    }
    setDanhSachCongDoan(newList)
    await updateCongDoanProgress(congHang.id, newList)
  }
  
  const handleAddDonHang = () => setEditDonHang([...editDonHang, { ma_don_hang: "", ma_hang: "", so_luong_san_xuat: 1 }])
  const handleRemoveDonHang = (index: number) => {
    const newList = [...editDonHang]
    newList.splice(index, 1)
    setEditDonHang(newList)
  }
  const handleUpdateDonHang = (index: number, field: string, value: any) => {
    const newList = [...editDonHang]
    newList[index] = { ...newList[index], [field]: value }
    setEditDonHang(newList)
  }

  const handleSaveDetails = async () => {
    for (const dh of editDonHang) {
      if (!dh.ma_don_hang || !dh.ma_hang || !dh.so_luong_san_xuat || dh.so_luong_san_xuat <= 0) {
        toast.error("Vui lòng điền đầy đủ và hợp lệ thông tin đơn hàng!")
        return
      }
    }
    setLoadingAction(true)
    const res = await updateCongHangDetails(congHang.id, editGhiChu, editDonHang)
    if (res.success) {
      toast.success("Cập nhật chi tiết thành công")
      setCongHang({ ...congHang, ghi_chu: editGhiChu, don_hang: editDonHang })
      setIsEditingMode(false)
    } else {
      toast.error(res.error)
    }
    setLoadingAction(false)
  }

  const handleStart = async () => {
    setLoadingAction(true)
    const res = await startCongHang(congHang.id)
    if (res.success) {
      toast.success("Đã chuyển sang trạng thái Đang làm")
      setCongHang({ ...congHang, trang_thai_sx: 'DANG_LAM' })
    } else toast.error(res.error)
    setLoadingAction(false)
  }

  const handleConfirmComplete = async () => {
    const validImages = finalImages.filter(Boolean)
    if (validImages.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 ảnh Bán thành phẩm!")
      return
    }
    setLoadingAction(true)
    const res = await completeCongHang(congHang.id, validImages)
    if (res.success) {
      toast.success("Đã hoàn thành Công hàng! Hàng đã được chuyển sang Kho Bán thành phẩm.")
      setCongHang({ ...congHang, trang_thai_sx: 'DA_LAM', trang_thai_kho: 'TON_KHO' })
      setShowFinalUpload(false)
    } else toast.error(res.error)
    setLoadingAction(false)
  }

  const handleDelete = async () => {
    if (!confirm("Xóa toàn bộ Công hàng này và các đơn hàng con?")) return
    setLoadingAction(true)
    const res = await deleteCongHang(congHang.id)
    if (res.success) {
      toast.success("Xóa thành công")
      if (onClose) onClose()
      else router.push('/san-xuat')
    } else {
      toast.error(res.error)
      setLoadingAction(false)
    }
  }

  const handleConfirmGiaoHang = async () => {
    if (!selectedDanhMucXuat) {
      toast.error("Vui lòng chọn mục xuất bán thành phẩm!")
      return
    }
    const validImages = giaoHangImages.filter(Boolean)
    if (validImages.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 ảnh minh chứng giao hàng!")
      return
    }
    setLoadingAction(true)
    const res = await xuatBanThanhPham({
      id_cong_hang: congHang.id,
      id_danh_muc: selectedDanhMucXuat,
      danh_sach_anh: validImages,
      ghi_chu: giaoHangGhiChu
    })
    setLoadingAction(false)
    if (res.success) {
      toast.success("Đã xuất kho giao Bán thành phẩm thành công!")
      setCongHang({ ...congHang, trang_thai_kho: 'DA_GIAO' })
      setShowGiaoHangModal(false)
    } else {
      toast.error(res.error || "Có lỗi xảy ra khi xuất kho")
    }
  }

  // Layout UI
  return (
    <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/10 w-full relative">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-background px-4 py-4 sm:px-6 ${isPopup ? '-mx-2.5 -mt-2.5 sm:-mx-6 sm:-mt-6 shrink-0' : 'mb-6 rounded-t-xl border'}`}>
        <div className="flex items-center gap-3">
          {!isPopup && (
            <Button variant="ghost" size="icon" onClick={() => router.push('/san-xuat')} className="shrink-0">
              <X className="h-5 w-5" />
            </Button>
          )}
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Factory className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">Công Hàng: {congHang.ma_cong_hang}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Tạo lúc: {format(new Date(congHang.ngay_tao), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto">
          {congHang.trang_thai_sx !== 'DA_LAM' && (
            <Button 
              variant={isEditingMode ? "default" : "outline"}
              className={isEditingMode ? "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-9 border-2 border-primary" : "border-2 border-primary bg-primary/10 hover:bg-primary/20 text-primary font-bold h-9 shadow-sm"}
              onClick={() => {
                if (isEditingMode) handleSaveDetails()
                else setIsEditingMode(true)
              }}
              disabled={loadingAction}
            >
              {isEditingMode ? "Lưu cập nhật" : "Cập nhật"}
            </Button>
          )}
          
          {isEditingMode && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="font-semibold h-9" onClick={() => {
                setIsEditingMode(false)
                setEditGhiChu(congHang.ghi_chu || "")
                setEditDonHang(congHang.don_hang || [])
              }}>
                Hủy
              </Button>
              {isManager && (
                <Button 
                  variant="destructive" 
                  className="font-bold shadow-md h-9"
                  onClick={handleDelete} 
                  disabled={loadingAction}
                >
                  Xóa
                </Button>
              )}
            </div>
          )}
          
          {congHang.trang_thai_sx === 'CHUA_LAM' && !isEditingMode && (
            <Button onClick={handleStart} disabled={loadingAction} className="bg-primary text-primary-foreground font-bold shadow-md h-9 border-2 border-primary">
              <Play className="mr-2 h-4 w-4" /> Bắt đầu Sản xuất
            </Button>
          )}
          
          {congHang.trang_thai_sx === 'DANG_LAM' && !isEditingMode && (
            <>
              <Link href={`/kho`} className="flex h-9 px-4 items-center justify-center rounded-md border-2 border-primary/60 bg-primary/10 hover:bg-primary/20 text-primary font-bold shadow-sm transition-colors text-sm">
                <Truck className="mr-2 h-4 w-4" /> Cấp / Phát Liệu
              </Link>
              {isManager && isAllStepsCompleted && (
                <Button onClick={() => setShowFinalUpload(true)} disabled={loadingAction} className="bg-green-600 hover:bg-green-700 text-white font-bold h-9 shadow-md border-2 border-green-500">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Chốt Hoàn Thành
                </Button>
              )}
            </>
          )}
          
          {congHang.trang_thai_sx === 'DA_LAM' && !isEditingMode && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-green-600 text-sm py-1.5 px-4"><CheckCircle2 className="mr-2 h-4 w-4" /> Đã hoàn thành</Badge>
              {congHang.trang_thai_kho === 'TON_KHO' && (
                <Button 
                  onClick={() => {
                    const firstDM = danhMucList.find(d => d.phan_he === 'BAN_THANH_PHAM' && d.loai_giao_dich === 'XUAT')
                    setSelectedDanhMucXuat(firstDM ? firstDM.id : "")
                    setGiaoHangImages([])
                    setGiaoHangGhiChu("")
                    setShowGiaoHangModal(true)
                  }} 
                  disabled={loadingAction}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 shadow-md border-2 border-blue-500"
                >
                  <Truck className="mr-2 h-4 w-4" /> Xuất BTP
                </Button>
              )}
              {congHang.trang_thai_kho === 'DA_GIAO' && (
                <Badge className="bg-green-700 text-sm py-1.5 px-4">Đã giao hàng</Badge>
              )}
            </div>
          )}
          
          {isManager && congHang.trang_thai_sx === 'CHUA_LAM' && !isEditingMode && (
            <Button variant="destructive" className="h-9 font-bold" onClick={handleDelete} disabled={loadingAction}>Xóa</Button>
          )}
        </div>
      </div>

      <div className={`flex-1 ${isPopup ? 'overflow-y-auto px-1 py-2 sm:py-4' : ''}`}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          
          {/* CỘT TRÁI (1 COL) - Thông tin tổng quan */}
          <div className="space-y-4 sm:space-y-6 xl:col-span-1">
            {/* Tiến độ tổng quan */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 bg-muted/10 border-b">
                <CardTitle className="text-base flex items-center">
                  <CircularProgressRing progress={progress} size={24} strokeWidth={3} className="mr-2" />
                  Tiến độ Tổng quan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hoàn thành {completedSteps}/{totalSteps} bước</span>
                  <span className="font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Đơn hàng */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 bg-muted/10 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4 text-primary" />
                    Chi tiết Đơn Hàng ({isEditingMode ? editDonHang.length : congHang.don_hang.length})
                  </div>
                  {isEditingMode && (
                    <Button variant="outline" size="sm" onClick={handleAddDonHang} className="h-7 px-2 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border-primary/40 shadow-sm">
                      + Thêm
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isEditingMode ? (
                  <div className="space-y-3">
                    {editDonHang.map((dh: any, index) => (
                      <div key={index} className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0">
                        <Input 
                          placeholder="Mã đơn hàng" 
                          value={dh.ma_don_hang} 
                          onChange={(e) => handleUpdateDonHang(index, 'ma_don_hang', e.target.value)}
                          className="h-8 text-sm font-semibold"
                        />
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Mã sản phẩm" 
                            value={dh.ma_hang} 
                            onChange={(e) => handleUpdateDonHang(index, 'ma_hang', e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                          <Input 
                            type="number"
                            placeholder="SL" 
                            value={dh.so_luong_san_xuat} 
                            onChange={(e) => handleUpdateDonHang(index, 'so_luong_san_xuat', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm w-20 text-center"
                            min={1}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={() => handleRemoveDonHang(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {congHang.don_hang.map((dh: any) => (
                      <div key={dh.id} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">{dh.ma_hang}</span>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">x{dh.so_luong_san_xuat}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">ĐH: {dh.ma_don_hang}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ghi chú */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 bg-muted/10 border-b">
                <CardTitle className="text-base flex items-center">
                  <ListTodo className="mr-2 h-4 w-4 text-primary" />
                  Ghi chú
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isEditingMode ? (
                  <Textarea 
                    value={editGhiChu}
                    onChange={(e) => setEditGhiChu(e.target.value)}
                    placeholder="Nhập ghi chú cho công hàng..."
                    className="min-h-[80px] text-sm"
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {congHang.ghi_chu || <span className="text-muted-foreground italic">Không có ghi chú</span>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BTP Images */}
            {congHang.trang_thai_sx === 'DA_LAM' && (() => {
              const btpLo = congHang.lo_giao_dich?.find((l: any) => l.danh_sach_anh && l.danh_sach_anh.length > 0)
              const images = btpLo ? btpLo.danh_sach_anh : []
              if (images.length === 0) return null
              return (
                <Card className="shadow-sm border-green-500/30">
                  <CardHeader className="pb-3 bg-green-500/10 border-b">
                    <CardTitle className="text-base flex items-center text-green-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Bán Thành Phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((img: string, i: number) => (
                        <div key={i} className="relative aspect-square rounded-lg border overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(img)}>
                          <Image src={img} alt={`BTP ${i+1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>

          {/* CỘT PHẢI (2 COLS) - Công đoạn */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="shadow-sm border-primary/20 h-full flex flex-col">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <ListTodo className="mr-2 h-5 w-5 text-primary" />
                  Phân công & Tiến độ chi tiết
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y h-full">
                  {danhSachCongDoan.map((cd, index) => {
                    const congDoanInfo = congDoanList.find(c => c.id === cd.id_cong_doan)
                    return (
                      <div key={index} className={`p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all relative border-l-4 ${cd.da_xong ? 'bg-green-500/10 border-green-500' : 'bg-card hover:bg-muted/40 border-transparent'}`}>
                        {congHang.trang_thai_sx === 'CHUA_LAM' && !cd.da_xong && (
                          <div className="absolute inset-0 bg-background/50 cursor-not-allowed z-10" />
                        )}
                        <div className="flex-1 space-y-2 z-20">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm sm:text-base ${cd.da_xong ? 'text-green-800 dark:text-green-300 line-through opacity-80' : 'text-foreground'}`}>
                              {index + 1}. {congDoanInfo?.ten_cong_doan || "Công đoạn không xác định"}
                            </span>
                            {cd.da_xong && <Badge variant="outline" className="text-green-700 bg-green-500/20 text-[10px] uppercase font-semibold">Đã xong</Badge>}
                          </div>
                          
                          <div className="w-full sm:w-80">
                            <select
                              className="w-full text-sm rounded-md border border-input bg-background px-3 py-1.5 disabled:opacity-50"
                              value={cd.id_cong_nhan || ""}
                              onChange={e => handleUpdateProgress(index, { id_cong_nhan: e.target.value })}
                              disabled={congHang.trang_thai_sx === 'DA_LAM' || !isEditingMode}
                            >
                              <option value="">{t("production.assignWorker")}</option>
                              {congNhanList.map(cn => (
                                <option key={cn.id} value={cn.id}>{cn.ho_ten} - {cn.vai_tro || "Công nhân"}</option>
                              ))}
                            </select>
                          </div>
                          {cd.ngay_cap_nhat && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Cập nhật: {format(new Date(cd.ngay_cap_nhat), 'dd/MM/yyyy HH:mm')}
                            </div>
                          )}
                        </div>
                        
                        <div className="w-full md:w-[170px] flex flex-col items-end gap-2 z-20 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-border/60">
                          {cd.da_xong ? (
                            <>
                              {cd.anh_minh_chung ? (
                                <div className="relative w-16 h-16 rounded-md border cursor-pointer overflow-hidden hover:border-primary transition-colors shrink-0" onClick={() => setPreviewImage(cd.anh_minh_chung)}>
                                  <Image src={cd.anh_minh_chung} alt="Minh chứng" fill className="object-cover" />
                                </div>
                              ) : <div className="text-xs italic text-muted-foreground">Đã xong</div>}
                              {congHang.trang_thai_sx !== 'DA_LAM' && isEditingMode && (
                                <label 
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 hover:bg-red-500/15 text-green-700 hover:text-red-600 border-2 border-green-500/40 hover:border-red-500/40 cursor-pointer shadow-sm w-full justify-center"
                                  onClick={(e) => { e.preventDefault(); handleUpdateProgress(index, { da_xong: false, anh_minh_chung: null }) }}
                                >
                                  <Checkbox checked={true} className="h-4 w-4 pointer-events-none" />
                                  <span className="text-xs font-bold">Hủy xong</span>
                                </label>
                              )}
                            </>
                          ) : (
                            <>
                              {isEditingMode ? (
                                showStageUploadForIndex === index ? (
                                  <div className="flex flex-col gap-1 border rounded-lg p-2 bg-muted/20 w-full">
                                    <ImageUpload 
                                      className="w-full min-h-[80px] rounded-lg border-dashed !bg-background"
                                      value={cd.anh_minh_chung}
                                      onChange={(url) => {
                                        if (url) {
                                          handleUpdateProgress(index, { da_xong: true, anh_minh_chung: url })
                                          setShowStageUploadForIndex(null)
                                          toast.success("Đã ghi nhận xong")
                                        }
                                      }}
                                    />
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowStageUploadForIndex(null)}>Hủy</Button>
                                  </div>
                                ) : (
                                  <label 
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border-2 border-primary/50 hover:border-primary cursor-pointer shadow-sm group w-full justify-center"
                                    onClick={(e) => { e.preventDefault(); setShowStageUploadForIndex(index); }}
                                  >
                                    <Checkbox checked={false} className="h-4 w-4 pointer-events-none" />
                                    <span className="text-sm font-bold group-hover:underline">Xác nhận xong</span>
                                  </label>
                                )
                              ) : (
                                <div className="h-10 flex items-center"><span className="text-xs text-muted-foreground italic">Đang chờ...</span></div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BOTTOM FULL WIDTH - Lịch sử cấp phát liệu */}
        <div className="mt-4 sm:mt-6 w-full">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 bg-muted/10 border-b">
              <CardTitle className="text-base flex items-center">
                <Truck className="mr-2 h-5 w-5 text-primary" />
                Lịch sử Cấp / Phát Liệu (Kho)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {lichSuPhatLieu.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Chưa có lịch sử giao dịch</div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap w-[150px]">Mã giao dịch</th>
                        <th className="px-4 py-3 whitespace-nowrap w-[150px]">Thời gian</th>
                        <th className="px-4 py-3 whitespace-nowrap w-[180px]">Người thực hiện</th>
                        <th className="px-4 py-3 min-w-[200px] max-w-[250px]">Loại & Nội dung</th>
                        <th className="px-4 py-3 min-w-[300px]">Chi tiết vật tư</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lichSuPhatLieu.map((phieu: any) => (
                        <tr key={phieu.id} className="hover:bg-muted/10 align-top">
                          <td className="px-4 py-3 font-medium text-primary">
                            <Link href={`/kho?lo_id=${phieu.id}`} className="hover:underline">{phieu.ma_lo}</Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono">{format(new Date(phieu.ngay_tao), 'dd/MM/yyyy HH:mm')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{phieu.tai_khoan?.ho_ten}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-normal text-[10px] mb-1.5">{phieu.danh_muc_giao_dich?.ten_danh_muc}</Badge>
                            {phieu.ghi_chu && <div className="text-xs text-muted-foreground italic mt-1 border-l-2 border-primary/20 pl-2">{phieu.ghi_chu}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1 bg-muted/10 rounded-md p-2 border">
                              {phieu.so_cai_vat_tu?.length > 0 ? (
                                phieu.so_cai_vat_tu.map((sc: any, idx: number) => {
                                  const qcArray = Array.isArray(sc.nguyen_lieu?.danh_sach_quy_cach) ? sc.nguyen_lieu.danh_sach_quy_cach : [];
                                  const qcObj = qcArray.find((q: any) => q.ma_quy_cach === sc.ma_quy_cach);
                                  const sl = Math.abs(Number(sc.bien_dong_so_luong) || 0);
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <span className="font-medium text-foreground truncate">{sc.nguyen_lieu?.ten_nguyen_lieu}</span>
                                        {qcObj?.ten && <span className="text-[10px] text-muted-foreground bg-background border px-1.5 py-0.5 rounded truncate">{qcObj.ten}</span>}
                                      </div>
                                      <span className="font-bold text-foreground shrink-0 whitespace-nowrap">
                                        {sl} {sc.nguyen_lieu?.don_vi || "SL"}
                                      </span>
                                    </div>
                                  )
                                })
                              ) : (
                                <span className="text-muted-foreground italic text-xs">Không có vật tư chi tiết</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG CHỐT HOÀN THÀNH */}
      <Dialog open={showFinalUpload} onOpenChange={setShowFinalUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hoàn thành Công hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Tải lên ảnh Bán thành phẩm để chuyển hàng vào kho.</p>
            <div className="grid grid-cols-3 gap-2">
              {finalImages.map((img, i) => (
                <div key={i} className="relative w-full aspect-square border rounded-md overflow-hidden group">
                  <Image src={img} alt={`BTP ${i}`} fill className="object-cover" />
                  <button className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100" onClick={() => { const a = [...finalImages]; a.splice(i, 1); setFinalImages(a) }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="col-span-3 min-h-[96px]">
                <ImageUpload value={null} onChange={(url) => url && setFinalImages([...finalImages, url])} className="w-full h-full text-xs !bg-background border-dashed" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFinalUpload(false)}>Hủy</Button>
            <Button onClick={handleConfirmComplete} disabled={loadingAction} className="bg-green-600 hover:bg-green-700">
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GIAO HÀNG (XUẤT BTP) DIALOG */}
      <Dialog open={showGiaoHangModal} onOpenChange={setShowGiaoHangModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center text-primary"><Truck className="mr-2 h-5 w-5" /> Xuất Kho (Giao hàng)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Mục xuất</label>
              <select className="w-full text-sm rounded-md border border-input bg-background px-3 py-2" value={selectedDanhMucXuat} onChange={e => setSelectedDanhMucXuat(e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {danhMucList.filter(d => d.phan_he === 'BAN_THANH_PHAM' && d.loai_giao_dich === 'XUAT').map(dm => <option key={dm.id} value={dm.id}>{dm.ten_danh_muc}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ảnh giao hàng</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {giaoHangImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                    <Image src={img} alt={`Giao hàng ${i}`} fill className="object-cover" />
                    <button className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100" onClick={() => { const a = [...giaoHangImages]; a.splice(i, 1); setGiaoHangImages(a) }}><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <div className="col-span-3 min-h-[96px]">
                  <ImageUpload value={null} onChange={(url) => url && setGiaoHangImages([...giaoHangImages, url])} className="w-full h-full text-xs !bg-background border-dashed" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú</label>
              <Textarea value={giaoHangGhiChu} onChange={e => setGiaoHangGhiChu(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGiaoHangModal(false)}>Hủy</Button>
            <Button onClick={handleConfirmGiaoHang} disabled={loadingAction} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />} Xác nhận Giao
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-[110]" onClick={() => setPreviewImage(null)}>
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
