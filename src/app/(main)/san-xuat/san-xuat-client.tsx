"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CongDoanManager } from "./cong-doan-manager"
import { CongHangForm } from "./cong-hang-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuItem,
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Factory, Package, ListTodo, CheckCircle2, Play, Truck, User, Search, Filter, ArrowLeft, Loader2, X, ChevronDown, MoreVertical, LayoutGrid, Table as TableIcon, Edit, Trash2, History, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { EditCongHangModal } from "./components/edit-cong-hang-modal"
import { HistoryCongDoanModal } from "./components/history-cong-doan-modal"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { 
  startCongHang, 
  completeCongHang, 
  updateCongDoanProgress,
  updateCongHangDetails,
  deleteCongHang,
  getLichSuPhatLieu
} from "@/app/actions/san-xuat"
import { xuatBanThanhPham } from "@/app/actions/giao-dich"
import { toast } from "sonner"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRealtimeSSE } from "@/components/realtime-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type CongHang = {
  id: string
  ma_cong_hang: string
  trang_thai_sx: 'CHUA_LAM' | 'DANG_LAM' | 'DA_LAM'
  danh_sach_cong_doan: any[]
  ghi_chu: string
  ngay_tao: string
  don_hang: any[]
  trang_thai_kho?: 'CHUA_NHAP' | 'TON_KHO' | 'DA_GIAO'
  lo_giao_dich?: any[]
}

type CongDoan = {
  id: string
  ten_cong_doan: string
  ghi_chu: string
}

export function SanXuatClient({ 
  congHangList, 
  congDoanList,
  congNhanList,
  danhMucList = [],
  isManager
}: { 
  congHangList: CongHang[]
  congDoanList: CongDoan[]
  congNhanList: any[]
  danhMucList?: any[]
  isManager: boolean
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("cong-hang")
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [editingCongHangModal, setEditingCongHangModal] = useState<any | null>(null)
  const [historyCongHangModal, setHistoryCongHangModal] = useState<any | null>(null)

  // Đăng ký nhận sự kiện Realtime SSE khi có thay đổi trong sản xuất và kho BTP (đồng bộ ngầm yên lặng)
  useRealtimeSSE({
    tables: ["cong_hang", "don_hang", "lo_giao_dich"],
    onUpdate: () => {
      router.refresh();
    },
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string[]>(['CHUA_LAM', 'DANG_LAM', 'DA_LAM'])
  const [filterKhoStatus, setFilterKhoStatus] = useState<string[]>(['CHUA_NHAP', 'TON_KHO'])
  const [filterWorker, setFilterWorker] = useState<string[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  // Modal state
  const [selectedCongHang, setSelectedCongHang] = useState<CongHang | null>(null)
  const [danhSachCongDoan, setDanhSachCongDoan] = useState<any[]>([])
  const [lichSuPhatLieu, setLichSuPhatLieu] = useState<any[]>([])
  const [loadingLichSu, setLoadingLichSu] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  
  // Edit mode state
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [editGhiChu, setEditGhiChu] = useState("")
  const [editDonHang, setEditDonHang] = useState<any[]>([])
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

  // Helper avatar từ Lô giao dịch nhập BTP
  const getAvatarImage = (ch: CongHang) => {
    if (!ch || !ch.lo_giao_dich) return null
    const btpLo = ch.lo_giao_dich.find((l: any) => l.danh_sach_anh && l.danh_sach_anh.length > 0)
    return btpLo ? btpLo.danh_sach_anh[0] : null
  }

  // FILTERING LOGIC
  const filteredList = useMemo(() => {
    return congHangList.filter(ch => {
      const q = searchQuery.toLowerCase()
      const matchQuery = ch.ma_cong_hang.toLowerCase().includes(q) ||
        ch.don_hang.some(dh => dh.ma_hang.toLowerCase().includes(q) || dh.ma_don_hang.toLowerCase().includes(q))
      
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(ch.trang_thai_sx)
      const matchKho = filterKhoStatus.length === 0 || filterKhoStatus.includes(ch.trang_thai_kho || 'CHUA_NHAP')
      const matchWorker = filterWorker.length === 0 || ch.danh_sach_cong_doan.some(cd => cd.id_cong_nhan && filterWorker.includes(cd.id_cong_nhan))
      
      return matchQuery && matchStatus && matchKho && matchWorker
    })
  }, [congHangList, searchQuery, filterStatus, filterKhoStatus, filterWorker])

  // PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE))
  const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterKhoStatus, filterWorker])

  const handleOpenDetail = async (ch: CongHang) => {
    setSelectedCongHang(ch)
    setDanhSachCongDoan(ch.danh_sach_cong_doan || [])
    setEditGhiChu(ch.ghi_chu || "")
    setEditDonHang(ch.don_hang || [])
    setIsEditingMode(false)
    setShowFinalUpload(false)
    setFinalImages([])
    setShowStageUploadForIndex(null)
    setLoadingLichSu(true)
    const ls = await getLichSuPhatLieu(ch.id)
    setLichSuPhatLieu(ls)
    setLoadingLichSu(false)
  }

  // MODAL ACTIONS
  const handleUpdateProgress = async (index: number, updates: any) => {
    if (!selectedCongHang) return
    const newList = [...danhSachCongDoan]
    newList[index] = { ...newList[index], ...updates }
    
    if (updates.da_xong !== undefined) {
      newList[index].ngay_cap_nhat = updates.da_xong ? new Date().toISOString() : null
    }
    
    setDanhSachCongDoan(newList)
    await updateCongDoanProgress(selectedCongHang.id, newList)
  }
  
  const handleAddDonHang = () => {
    setEditDonHang([...editDonHang, { ma_don_hang: "", ma_hang: "", so_luong_san_xuat: 1 }])
  }
  
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
    if (!selectedCongHang) return
    
    // validate
    for (const dh of editDonHang) {
      if (!dh.ma_don_hang || !dh.ma_hang || !dh.so_luong_san_xuat || dh.so_luong_san_xuat <= 0) {
        toast.error("Vui lòng điền đầy đủ và hợp lệ thông tin đơn hàng!")
        return
      }
    }
    
    setLoadingAction(true)
    const res = await updateCongHangDetails(selectedCongHang.id, editGhiChu, editDonHang)
    if (res.success) {
      toast.success("Cập nhật chi tiết thành công")
      setSelectedCongHang({ ...selectedCongHang, ghi_chu: editGhiChu, don_hang: editDonHang })
      setIsEditingMode(false)
    } else {
      toast.error(res.error)
    }
    setLoadingAction(false)
  }

  const handleStart = async () => {
    if (!selectedCongHang) return
    setLoadingAction(true)
    const res = await startCongHang(selectedCongHang.id)
    if (res.success) {
      toast.success("Đã chuyển sang trạng thái Đang làm")
      setSelectedCongHang(prev => prev ? { ...prev, trang_thai_sx: 'DANG_LAM' } : null)
    }
    else toast.error(res.error)
    setLoadingAction(false)
  }

  const handleCompleteClick = () => {
    if (!selectedCongHang) return
    const totalSteps = danhSachCongDoan.length
    const completedSteps = danhSachCongDoan.filter(cd => cd.da_xong).length
    if (completedSteps < totalSteps && !confirm("Chưa hoàn thành tất cả công đoạn. Bạn có chắc muốn chốt hoàn thành?")) return
    setShowFinalUpload(true)
  }

  const handleConfirmComplete = async () => {
    if (!selectedCongHang) return
    const validImages = finalImages.filter(Boolean)
    if (validImages.length === 0) {
      toast.error("Vui lòng tải lên ít nhất 1 ảnh Bán thành phẩm!")
      return
    }
    setLoadingAction(true)
    const res = await completeCongHang(selectedCongHang.id, validImages)
    if (res.success) {
      toast.success("Đã hoàn thành Công hàng! Hàng đã được chuyển sang Kho Bán thành phẩm.")
      setSelectedCongHang(prev => prev ? { ...prev, trang_thai_sx: 'DA_LAM' } : null)
      setShowFinalUpload(false)
    }
    else toast.error(res.error)
    setLoadingAction(false)
  }

  const handleDelete = async () => {
    if (!selectedCongHang) return
    if (!confirm("Xóa toàn bộ Công hàng này và các đơn hàng con?")) return
    setLoadingAction(true)
    const res = await deleteCongHang(selectedCongHang.id)
    if (res.success) {
      toast.success("Xóa thành công")
      setSelectedCongHang(null)
    } else {
      toast.error(res.error)
    }
    setLoadingAction(false)
  }

  const congDoanMap = useMemo(() => {
    const map = new Map<string, string>()
    congDoanList.forEach(cd => map.set(cd.id, cd.ten_cong_doan))
    return map
  }, [congDoanList])

  const handleDeleteCongHangById = async (id: string) => {
    if (!confirm("Xóa toàn bộ Công hàng này và các đơn hàng con?")) return
    setLoadingAction(true)
    const res = await deleteCongHang(id)
    if (res.success) {
      toast.success("Xóa thành công")
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setLoadingAction(false)
  }

  const toggleStatusFilter = (status: string) => {
    setFilterStatus(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const toggleKhoStatusFilter = (status: string) => {
    setFilterKhoStatus(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const toggleWorkerFilter = (workerId: string) => {
    setFilterWorker(prev => 
      prev.includes(workerId) ? prev.filter(w => w !== workerId) : [...prev, workerId]
    )
  }

  const handleConfirmGiaoHang = async () => {
    if (!selectedCongHang) return
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
      id_cong_hang: selectedCongHang.id,
      id_danh_muc: selectedDanhMucXuat,
      danh_sach_anh: validImages,
      ghi_chu: giaoHangGhiChu
    })
    setLoadingAction(false)
    if (res.success) {
      toast.success("Đã xuất kho giao Bán thành phẩm thành công!")
      setSelectedCongHang({ ...selectedCongHang, trang_thai_kho: 'DA_GIAO' })
      setShowGiaoHangModal(false)
    } else {
      toast.error(res.error || "Có lỗi xảy ra khi xuất kho")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-2">
        {activeTab === "cong-hang" && (
          <CongHangForm congDoanList={congDoanList} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="cong-hang">Tiến độ Công hàng</TabsTrigger>
          <TabsTrigger value="cong-doan">Danh mục Công đoạn</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cong-hang" className="mt-6">
          <div className="flex flex-col gap-4">
            
            {/* Thanh Công cụ Lọc */}
            <div className="flex flex-wrap items-center justify-start gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="relative w-full sm:w-auto sm:flex-1 min-w-[250px] max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm mã công, mã hàng..."
                  className="pl-9 bg-background h-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="h-10 w-full sm:w-auto min-w-[200px] justify-between font-normal bg-background">
                      <span className="truncate">
                        {filterStatus.length === 0 ? "Lọc theo trạng thái" : `Đã chọn ${filterStatus.length} trạng thái`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuCheckboxItem
                    checked={filterStatus.includes('CHUA_LAM')}
                    onCheckedChange={() => toggleStatusFilter('CHUA_LAM')}
                  >
                    Chưa sản xuất
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterStatus.includes('DANG_LAM')}
                    onCheckedChange={() => toggleStatusFilter('DANG_LAM')}
                  >
                    Đang sản xuất
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterStatus.includes('DA_LAM')}
                    onCheckedChange={() => toggleStatusFilter('DA_LAM')}
                  >
                    Đã hoàn thành
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="h-10 w-full sm:w-auto min-w-[180px] justify-between font-normal bg-background">
                      <span className="truncate">
                        {filterKhoStatus.length === 0 ? "Lọc theo kho" : `Kho (${filterKhoStatus.length})`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuCheckboxItem
                    checked={filterKhoStatus.includes('CHUA_NHAP')}
                    onCheckedChange={() => toggleKhoStatusFilter('CHUA_NHAP')}
                  >
                    Chưa nhập kho
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterKhoStatus.includes('TON_KHO')}
                    onCheckedChange={() => toggleKhoStatusFilter('TON_KHO')}
                  >
                    Tồn kho BTP
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filterKhoStatus.includes('DA_GIAO')}
                    onCheckedChange={() => toggleKhoStatusFilter('DA_GIAO')}
                  >
                    Đã giao hàng
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="h-10 w-full sm:w-auto min-w-[200px] justify-between font-normal bg-background">
                      <span className="truncate">
                        {filterWorker.length === 0 ? "Tất cả công nhân" : `Đã chọn ${filterWorker.length} công nhân`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto" align="start">
                  {congNhanList.map(cn => (
                    <DropdownMenuCheckboxItem
                      key={cn.id}
                      checked={filterWorker.includes(cn.id)}
                      onCheckedChange={() => toggleWorkerFilter(cn.id)}
                    >
                      {cn.ho_ten}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {congNhanList.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">Chưa có dữ liệu</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bộ lọc nhanh Trạng thái công hàng (Item 20) & Nút gạt chế độ Thẻ/Bảng (Item 26) */}
              <div className="flex flex-wrap items-center justify-between gap-3 w-full pt-2 border-t mt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Trạng thái:</span>
                  {[
                    { label: 'Tất cả', value: 'ALL' },
                    { label: 'Chưa làm', value: 'CHUA_LAM' },
                    { label: 'Đang làm', value: 'DANG_LAM' },
                    { label: 'Đã hoàn thành', value: 'DA_LAM' }
                  ].map(st => {
                    const isSelected = st.value === 'ALL' ? filterStatus.length === 3 : filterStatus.includes(st.value) && filterStatus.length === 1;
                    return (
                      <Button
                        key={st.value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs px-2.5 rounded-full"
                        onClick={() => {
                          if (st.value === 'ALL') {
                            setFilterStatus(['CHUA_LAM', 'DANG_LAM', 'DA_LAM']);
                          } else {
                            setFilterStatus([st.value]);
                          }
                        }}
                      >
                        {st.label}
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setViewMode('card')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Thẻ
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => setViewMode('table')}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      Bảng
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">
                    Hiển thị {filteredList.length} công hàng
                  </div>
                </div>
              </div>
            </div>

            {/* Hiển thị Dạng Thẻ hoặc Dạng Bảng (Item 26) */}
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedList.map(ch => {
                  const totalSteps = ch.danh_sach_cong_doan.length
                  const completedSteps = ch.danh_sach_cong_doan.filter(cd => cd.da_xong).length
                  const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)

                  return (
                    <Card
                      key={ch.id}
                      className="group relative overflow-hidden border-2 hover:border-primary/60 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                      onClick={() => handleOpenDetail(ch)}
                    >
                      {/* Top Banner: Mã đơn hàng & Số Lượng Sản Xuất (Item 10) */}
                      <div className="bg-primary/5 dark:bg-primary/10 border-b px-3.5 py-2 flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 truncate">
                          {ch.don_hang.map((dh, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-xs font-bold text-primary shrink-0">
                                [{dh.ma_don_hang}]
                              </span>
                              <span className="text-xs font-semibold text-foreground truncate" title={dh.ma_hang}>
                                {dh.ma_hang}
                              </span>
                              <Badge variant="default" className="text-[10px] h-5 px-1.5 ml-auto shrink-0 font-bold">
                                x{dh.so_luong_san_xuat}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        {/* Menu 3 chấm option gọn gàng (Item 27) */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setEditingCongHangModal(ch)}>
                              <Edit className="w-3.5 h-3.5 mr-2 text-primary" />
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryCongHangModal(ch)}>
                              <History className="w-3.5 h-3.5 mr-2 text-primary" />
                              Lịch sử tiến độ
                            </DropdownMenuItem>
                            {isManager && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteCongHangById(ch.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Xóa công hàng
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardContent className="p-4 space-y-4">
                        {/* Avatar & Mã công hàng & Trạng thái */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {getAvatarImage(ch) ? (
                              <div
                                className="relative w-11 h-11 rounded-lg overflow-hidden border shrink-0 cursor-zoom-in shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewImage(getAvatarImage(ch)!)
                                }}
                              >
                                <Image src={getAvatarImage(ch)!} alt="BTP" fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-muted/40 border flex items-center justify-center shrink-0">
                                <Factory className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm sm:text-base text-primary">
                                {ch.ma_cong_hang}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(new Date(ch.ngay_tao), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {ch.trang_thai_sx === 'CHUA_LAM' && <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]"><ListTodo className="w-3 h-3 mr-1"/> Chưa làm</Badge>}
                            {ch.trang_thai_sx === 'DANG_LAM' && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]"><Factory className="w-3 h-3 mr-1"/> Đang SX</Badge>}
                            {ch.trang_thai_sx === 'DA_LAM' && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1"/> Đã xong</Badge>}
                          </div>
                        </div>

                        {/* Danh sách các bước công đoạn & Biểu đồ tiến độ tròn % (Item 19) */}
                        <div className="pt-2 border-t flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between mb-1">
                              <span>Các bước công đoạn:</span>
                              <span className="font-bold text-foreground">{completedSteps}/{totalSteps} xong</span>
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {ch.danh_sach_cong_doan.map((cd, index) => {
                                const stageName = congDoanMap.get(cd.id_cong_doan) || "Công đoạn";
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between text-xs p-1.5 rounded-md border ${
                                      cd.da_xong
                                        ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-medium"
                                        : "bg-background border-border/50 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${cd.da_xong ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                                      <span className="truncate" title={stageName}>{stageName}</span>
                                    </div>
                                    {cd.da_xong ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 ml-1" />
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground shrink-0 ml-1">Đang làm</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Biểu đồ % tiến độ tròn bên phải (Item 19) */}
                          <div className="flex flex-col items-center justify-center shrink-0 pt-2">
                            <CircularProgressRing progress={progress} size={64} strokeWidth={5} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {paginatedList.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground border rounded-xl bg-muted/10">
                    Không tìm thấy công hàng nào phù hợp với bộ lọc.
                  </div>
                )}
              </div>
            ) : (
              /* Bảng Danh sách Công hàng (Table View) */
              <div className="border rounded-xl bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[220px]">Công hàng</TableHead>
                        <TableHead className="w-[260px]">Đơn hàng / Sản phẩm</TableHead>
                        <TableHead className="w-[140px]">Trạng thái SX</TableHead>
                        <TableHead className="w-[130px]">Trạng thái Kho</TableHead>
                        <TableHead>Tiến độ công đoạn</TableHead>
                        <TableHead className="w-[70px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedList.map(ch => {
                        const totalSteps = ch.danh_sach_cong_doan.length
                        const completedSteps = ch.danh_sach_cong_doan.filter(cd => cd.da_xong).length
                        const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)

                        return (
                          <TableRow 
                            key={ch.id} 
                            className="cursor-pointer hover:bg-primary/5 transition-colors"
                            onClick={() => handleOpenDetail(ch)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {getAvatarImage(ch) && (
                                  <div 
                                    className="relative w-10 h-10 rounded-lg overflow-hidden border shrink-0 cursor-zoom-in shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewImage(getAvatarImage(ch)!)
                                    }}
                                    title="Ảnh bán thành phẩm sau khi hoàn thành"
                                  >
                                    <Image src={getAvatarImage(ch)!} alt="BTP" fill className="object-cover" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-primary">{ch.ma_cong_hang}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(ch.ngay_tao), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {ch.don_hang.map(dh => (
                                  <div key={dh.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-1 last:pb-0">
                                    <span className="font-medium text-muted-foreground" title="Mã đơn hàng">{dh.ma_don_hang}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{dh.ma_hang}</span>
                                      <Badge variant="outline" className="text-xs">x{dh.so_luong_san_xuat}</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {ch.trang_thai_sx === 'CHUA_LAM' && <Badge variant="secondary" className="bg-muted text-muted-foreground"><ListTodo className="w-3 h-3 mr-1"/> Chưa làm</Badge>}
                              {ch.trang_thai_sx === 'DANG_LAM' && <Badge className="bg-primary/10 text-primary border-primary/20"><Factory className="w-3 h-3 mr-1"/> Đang sản xuất</Badge>}
                              {ch.trang_thai_sx === 'DA_LAM' && <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Đã hoàn thành</Badge>}
                            </TableCell>
                            <TableCell>
                              {ch.trang_thai_kho === 'TON_KHO' ? (
                                <Badge className="bg-amber-500 hover:bg-amber-600">Tồn kho BTP</Badge>
                              ) : ch.trang_thai_kho === 'DA_GIAO' ? (
                                <Badge className="bg-green-600 hover:bg-green-700">Đã giao</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">Chưa nhập</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 pr-2">
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span>{completedSteps}/{totalSteps} bước</span>
                                    <span className="font-medium">{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                                <CircularProgressRing progress={progress} size={36} strokeWidth={3} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => setEditingCongHangModal(ch)}>
                                    <Edit className="w-3.5 h-3.5 mr-2 text-primary" />
                                    Sửa thông tin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setHistoryCongHangModal(ch)}>
                                    <History className="w-3.5 h-3.5 mr-2 text-primary" />
                                    Lịch sử tiến độ
                                  </DropdownMenuItem>
                                  {isManager && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteCongHangById(ch.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                                      Xóa công hàng
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {paginatedList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            Không tìm thấy công hàng nào phù hợp với bộ lọc.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredList.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-4">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredList.length)} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} trong tổng số <span className="font-semibold text-foreground">{filteredList.length}</span> bản ghi
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Trước
                  </Button>
                  <div className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cong-doan" className="mt-3 sm:mt-6">
          <CongDoanManager initialData={congDoanList} />
        </TabsContent>
      </Tabs>

      {/* POPUP CHI TIẾT CÔNG HÀNG */}
      <Dialog open={!!selectedCongHang} onOpenChange={(open) => !open && setSelectedCongHang(null)}>
        <DialogContent className="w-[98vw] sm:max-w-6xl max-h-[96vh] overflow-hidden flex flex-col bg-slate-50/50 p-2.5 sm:p-6">
          <DialogHeader className="border-b pb-2.5 sm:pb-4 bg-background px-3 pt-3 sm:px-6 sm:pt-6 -mx-3 -mt-3 sm:-mx-6 sm:-mt-6 shrink-0">
            <DialogTitle className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <Factory className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">Công Hàng: {selectedCongHang?.ma_cong_hang}</h1>
                  <p className="text-muted-foreground text-xs sm:text-sm font-normal">
                    Tạo lúc: {selectedCongHang && format(new Date(selectedCongHang.ngay_tao), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {(() => {
                const totalSteps = danhSachCongDoan.length;
                const completedSteps = danhSachCongDoan.filter(cd => cd.da_xong).length;
                const isAllStepsCompleted = totalSteps > 0 && completedSteps === totalSteps;
                
                return (
                  <div className="flex flex-wrap items-center justify-start md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto mt-1 sm:mt-0">
                    {selectedCongHang?.trang_thai_sx !== 'DA_LAM' && (
                      <Button 
                        variant={isEditingMode ? "default" : "outline"}
                        className={isEditingMode ? "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm border-2 border-primary" : "border-2 border-primary bg-primary/10 hover:bg-primary/20 text-primary font-bold h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm shadow-sm"}
                        onClick={() => {
                          if (isEditingMode) {
                            handleSaveDetails()
                          } else {
                            setIsEditingMode(true)
                          }
                        }}
                        disabled={loadingAction}
                      >
                        {isEditingMode ? <>Lưu cập nhật</> : <>Cập nhật công hàng</>}
                      </Button>
                    )}
                    {isEditingMode && (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button variant="ghost" className="font-semibold h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => {
                          setIsEditingMode(false)
                          setEditGhiChu(selectedCongHang?.ghi_chu || "")
                          setEditDonHang(selectedCongHang?.don_hang || [])
                        }}>
                          Hủy
                        </Button>
                        {isManager && (
                          <Button 
                            variant="destructive" 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md h-8 px-2.5 text-xs sm:h-9 sm:px-4 sm:text-sm"
                            onClick={handleDelete} 
                            disabled={loadingAction}
                          >
                            Xóa công hàng
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {selectedCongHang?.trang_thai_sx === 'CHUA_LAM' && !isEditingMode && (
                      <Button onClick={handleStart} disabled={loadingAction} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm border-2 border-primary">
                        <Play className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Bắt đầu Sản xuất
                      </Button>
                    )}
                    {selectedCongHang?.trang_thai_sx === 'DANG_LAM' && !isEditingMode && (
                      <>
                        <Link href={`/kho`} className="flex h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm items-center justify-center rounded-md border-2 border-primary/60 bg-primary/10 hover:bg-primary/20 text-primary font-bold shadow-sm transition-colors">
                          <Truck className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Cấp / Phát Liệu
                        </Link>
                        {isManager && isAllStepsCompleted && (
                          <Button onClick={handleCompleteClick} disabled={loadingAction} className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm shadow-md border-2 border-green-500">
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Chốt Hoàn Thành
                          </Button>
                        )}
                      </>
                    )}
                    {selectedCongHang?.trang_thai_sx === 'DA_LAM' && !isEditingMode && (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge className="bg-green-600 text-xs sm:text-sm py-1 px-2.5 sm:py-1.5 sm:px-4"><CheckCircle2 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Đã hoàn thành</Badge>
                        {selectedCongHang.trang_thai_kho === 'TON_KHO' && (
                          <Button 
                            onClick={() => {
                              const firstDM = danhMucList.find(d => d.phan_he === 'BAN_THANH_PHAM' && d.loai_giao_dich === 'XUAT')
                              setSelectedDanhMucXuat(firstDM ? firstDM.id : "")
                              setGiaoHangImages([])
                              setGiaoHangGhiChu("")
                              setShowGiaoHangModal(true)
                            }} 
                            disabled={loadingAction}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm shadow-md border-2 border-blue-500 gap-1.5"
                          >
                            <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Giao hàng (Xuất BTP)
                          </Button>
                        )}
                        {selectedCongHang.trang_thai_kho === 'DA_GIAO' && (
                          <Badge className="bg-green-700 text-xs sm:text-sm py-1 px-2.5 sm:py-1.5 sm:px-4">Đã giao hàng</Badge>
                        )}
                      </div>
                    )}
                    {isManager && selectedCongHang?.trang_thai_sx === 'CHUA_LAM' && !isEditingMode && (
                      <Button variant="destructive" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm font-bold" onClick={handleDelete} disabled={loadingAction}>Xóa</Button>
                    )}
                  </div>
                )
              })()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-0.5 sm:px-1 py-2 sm:py-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6">
              
              {/* CỘT TRÁI: TIẾN ĐỘ & DANH SÁCH CÔNG ĐOẠN */}
              <div className="xl:col-span-2 space-y-3 sm:space-y-6">
                <Card className="shadow-sm border-primary/20">
                  <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/10 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-base sm:text-lg flex items-center">
                      <ListTodo className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Danh Sách Công Đoạn & Giao Việc
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {danhSachCongDoan.map((cd, index) => {
                        const congDoanInfo = congDoanList.find(c => c.id === cd.id_cong_doan)
                        return (
                          <div key={index} className={`p-2.5 sm:p-4 flex flex-col md:flex-row md:items-start justify-between gap-2.5 sm:gap-4 transition-all relative border-l-4 ${cd.da_xong ? 'bg-green-500/15 dark:bg-green-500/10 border-green-500' : 'bg-card hover:bg-muted/40 border-transparent'}`}>
                            
                            {/* Lớp phủ chặn thao tác khi chưa sản xuất */}
                            {selectedCongHang?.trang_thai_sx === 'CHUA_LAM' && !cd.da_xong && (
                              <div className="absolute inset-0 bg-background/50 cursor-not-allowed z-10" title="Cần bắt đầu sản xuất trước" />
                            )}
                            
                            {/* Thông tin công đoạn */}
                            <div className="flex-1 space-y-1.5 sm:space-y-2 z-20">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm sm:text-base ${cd.da_xong ? 'text-green-800 dark:text-green-300 line-through opacity-80' : 'text-foreground'}`}>
                                  {index + 1}. {congDoanInfo?.ten_cong_doan || "Công đoạn không xác định"}
                                </span>
                                {cd.da_xong && <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-600/50 dark:border-green-400/50 bg-green-500/20 text-[10px] uppercase font-semibold">Đã xong</Badge>}
                              </div>
                              
                              <div className="w-full sm:w-64">
                                <select
                                  className="w-full text-xs sm:text-sm rounded-md border border-input bg-background px-2.5 py-1 sm:px-3 sm:py-1.5 disabled:opacity-50"
                                  value={cd.id_cong_nhan || ""}
                                  onChange={e => handleUpdateProgress(index, { id_cong_nhan: e.target.value })}
                                  disabled={selectedCongHang?.trang_thai_sx === 'DA_LAM' || !isEditingMode}
                                >
                                  <option value="">-- Phân công công nhân --</option>
                                  {congNhanList.map(cn => (
                                    <option key={cn.id} value={cn.id}>{cn.ho_ten} ({cn.ma_cong_nhan})</option>
                                  ))}
                                </select>
                              </div>

                              {cd.ngay_cap_nhat && (
                                <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                                  Cập nhật: {format(new Date(cd.ngay_cap_nhat), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </div>
                              )}
                            </div>
                            
                            {/* Actions & Image Upload */}
                            <div className="w-full md:w-[170px] flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 z-20 mt-1.5 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-dashed border-border/60">
                              {cd.da_xong ? (
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full gap-2">
                                  {cd.anh_minh_chung ? (
                                    <div 
                                      className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-md border cursor-pointer overflow-hidden hover:border-primary transition-colors shrink-0"
                                      onClick={() => setPreviewImage(cd.anh_minh_chung)}
                                    >
                                      <Image src={cd.anh_minh_chung} alt="Minh chứng" fill className="object-cover" />
                                    </div>
                                  ) : (
                                    <div className="text-xs italic text-muted-foreground">Đã xong</div>
                                  )}
                                  {selectedCongHang?.trang_thai_sx !== 'DA_LAM' && isEditingMode && (
                                    <label 
                                      className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-green-500/15 hover:bg-red-500/15 text-green-700 dark:text-green-400 hover:text-red-600 border-2 border-green-500/40 hover:border-red-500/40 cursor-pointer transition-all select-none group shadow-sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleUpdateProgress(index, { da_xong: false, anh_minh_chung: null });
                                      }}
                                      title="Bấm để hủy hoàn thành công đoạn này"
                                    >
                                      <Checkbox 
                                        checked={true}
                                        className="h-4 w-4 pointer-events-none border-2 border-green-600 data-[state=checked]:bg-green-600"
                                      />
                                      <span className="text-xs font-bold">Đã hoàn thành (Hủy)</span>
                                    </label>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full gap-2">
                                  {isEditingMode ? (
                                    showStageUploadForIndex === index ? (
                                      <div className="flex flex-col items-center gap-1 border rounded-lg p-2 bg-muted/20 w-full">
                                        <ImageUpload 
                                          className="w-16 h-16 rounded-lg border-dashed !bg-background"
                                          value={cd.anh_minh_chung}
                                          onChange={(url) => {
                                            if (url) {
                                              handleUpdateProgress(index, { da_xong: true, anh_minh_chung: url })
                                              setShowStageUploadForIndex(null)
                                              toast.success("Đã ghi nhận công đoạn hoàn thành")
                                            } else {
                                              handleUpdateProgress(index, { anh_minh_chung: null })
                                            }
                                          }}
                                        />
                                        <div className="flex gap-2 w-full mt-1">
                                          <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => setShowStageUploadForIndex(null)}>Hủy tải ảnh</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label 
                                        className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border-2 border-primary/50 hover:border-primary cursor-pointer transition-all shadow-sm select-none group ml-auto md:ml-0"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setShowStageUploadForIndex(index);
                                        }}
                                      >
                                        <Checkbox 
                                          checked={false}
                                          className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground pointer-events-none"
                                        />
                                        <span className="text-xs sm:text-sm font-bold group-hover:underline">Xác nhận xong</span>
                                      </label>
                                    )
                                  ) : (
                                    <div className="h-8 sm:h-16 flex items-center ml-auto md:ml-0">
                                      <span className="text-xs text-muted-foreground italic">Đang chờ...</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {danhSachCongDoan.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">Không có công đoạn nào</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CỘT PHẢI: LỊCH SỬ PHÁT LIỆU & ĐƠN HÀNG */}
              <div className="space-y-6">
                
                {/* Ảnh hoàn thành / Bán thành phẩm */}
                {selectedCongHang?.trang_thai_sx === 'DA_LAM' && (() => {
                  const btpLo = selectedCongHang.lo_giao_dich?.find((l: any) => l.danh_sach_anh && l.danh_sach_anh.length > 0)
                  const images = btpLo ? btpLo.danh_sach_anh : []
                  if (images.length === 0) return null
                  return (
                    <Card className="shadow-sm border-green-500/30">
                      <CardHeader className="pb-2 sm:pb-3 bg-green-500/10 px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="text-base flex items-center text-green-700 dark:text-green-300">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Minh chứng Hoàn Thành / Kho BTP
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((img: string, i: number) => (
                            <div 
                              key={i} 
                              className="relative aspect-square rounded-lg border overflow-hidden cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={() => setPreviewImage(img)}
                            >
                              <Image src={img} alt={`BTP ${i+1}`} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Đơn hàng */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3 bg-muted/10 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-primary" />
                        Chi tiết Đơn Hàng ({isEditingMode ? editDonHang.length : selectedCongHang?.don_hang.length})
                      </div>
                      {isEditingMode && (
                        <Button variant="outline" size="sm" onClick={handleAddDonHang} className="h-8 px-3 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/40 shadow-sm transition-all">
                          + Thêm đơn hàng
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                    {isEditingMode ? (
                      <div className="space-y-2 sm:space-y-3">
                        {editDonHang.map((dh: any, index) => (
                          <div key={index} className="flex flex-col gap-2 border-b pb-2.5 sm:pb-3 last:border-0 last:pb-0 relative group">
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100 transition-opacity" onClick={() => handleRemoveDonHang(index)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {editDonHang.length === 0 && <div className="text-xs text-muted-foreground italic text-center">Chưa có đơn hàng nào</div>}
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {selectedCongHang?.don_hang.map((dh: any) => (
                          <div key={dh.id} className="flex flex-col border-b pb-2 sm:pb-3 last:border-0 last:pb-0">
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
                  <CardHeader className="pb-2 sm:pb-3 bg-muted/10 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-base flex items-center">
                      <ListTodo className="mr-2 h-4 w-4 text-primary" />
                      Ghi chú công hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                    {isEditingMode ? (
                      <Textarea 
                        value={editGhiChu}
                        onChange={(e) => setEditGhiChu(e.target.value)}
                        placeholder="Nhập ghi chú cho công hàng..."
                        className="min-h-[80px] text-sm"
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {selectedCongHang?.ghi_chu || <span className="text-muted-foreground italic">Không có ghi chú</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vật tư phát liệu */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3 bg-muted/10 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center">
                        <Truck className="mr-2 h-4 w-4 text-primary" />
                        Lịch sử Cấp / Phát Liệu
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-4 p-0">
                    {loadingLichSu ? (
                      <div className="flex justify-center py-4 sm:py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : lichSuPhatLieu.length === 0 ? (
                      <div className="text-muted-foreground text-sm text-center py-4 sm:py-6">Chưa có phiếu xuất/nhập vật tư nào cho mã công này.</div>
                    ) : (
                      <div className="divide-y">
                        {lichSuPhatLieu.map((phieu: any) => (
                          <div key={phieu.id} className="p-2.5 sm:p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <Link href={`/kho?lo_id=${phieu.id}`} className="font-semibold text-sm text-primary hover:underline">
                                {phieu.ma_lo}
                              </Link>
                              <span className="text-xs text-muted-foreground">{format(new Date(phieu.ngay_tao), 'dd/MM/yy')}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <Badge variant="outline" className="font-normal text-[10px]">{phieu.danh_muc_giao_dich?.ten_danh_muc}</Badge>
                              <span className="text-muted-foreground">{phieu.tai_khoan?.ho_ten}</span>
                            </div>
                            {phieu.ghi_chu && <div className="text-xs text-muted-foreground mt-1.5 italic border-l-2 pl-2 border-primary/20">{phieu.ghi_chu}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CHỐT HOÀN THÀNH */}
      <Dialog open={showFinalUpload} onOpenChange={setShowFinalUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hoàn thành Công hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Vui lòng tải lên ảnh Bán thành phẩm (có thể tải lên nhiều ảnh) để chốt hoàn thành công hàng và chuyển hàng vào kho.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {finalImages.map((img, i) => (
                <div key={i} className="relative w-full aspect-square border rounded-md overflow-hidden group">
                  <Image src={img} alt={`BTP ${i}`} fill className="object-cover" />
                  <button 
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newArr = [...finalImages]
                      newArr.splice(i, 1)
                      setFinalImages(newArr)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="w-full aspect-square">
                <ImageUpload 
                  value={null}
                  onChange={(url) => {
                    if (url) setFinalImages([...finalImages, url])
                  }}
                  className="w-full h-full text-xs !bg-background border-dashed"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFinalUpload(false)}>Hủy</Button>
            <Button onClick={handleConfirmComplete} disabled={loadingAction} className="bg-green-600 hover:bg-green-700">
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Xác nhận Hoàn thành
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GIAO HÀNG (XUẤT BÁN THÀNH PHẨM) DIALOG */}
      <Dialog open={showGiaoHangModal} onOpenChange={setShowGiaoHangModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-primary">
              <Truck className="mr-2 h-5 w-5" /> Xuất Kho Bán Thành Phẩm (Giao hàng)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Mục xuất bán thành phẩm</label>
              <select
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2"
                value={selectedDanhMucXuat}
                onChange={e => setSelectedDanhMucXuat(e.target.value)}
              >
                <option value="">-- Chọn danh mục xuất --</option>
                {danhMucList.filter(d => d.phan_he === 'BAN_THANH_PHAM' && d.loai_giao_dich === 'XUAT').map(dm => (
                  <option key={dm.id} value={dm.id}>{dm.ten_danh_muc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Ảnh minh chứng giao hàng (bắt buộc)</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {giaoHangImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg border overflow-hidden group">
                    <Image src={img} alt={`Giao hàng ${i}`} fill className="object-cover" />
                    <button 
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newArr = [...giaoHangImages]
                        newArr.splice(i, 1)
                        setGiaoHangImages(newArr)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="w-full aspect-square">
                  <ImageUpload 
                    value={null}
                    onChange={(url) => {
                      if (url) setGiaoHangImages([...giaoHangImages, url])
                    }}
                    className="w-full h-full text-xs !bg-background border-dashed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Ghi chú giao hàng</label>
              <Textarea 
                placeholder="Ghi chú người nhận, số xe, v.v..."
                value={giaoHangGhiChu}
                onChange={e => setGiaoHangGhiChu(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGiaoHangModal(false)}>Hủy</Button>
            <Button onClick={handleConfirmGiaoHang} disabled={loadingAction} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
              Xác nhận Giao hàng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup chỉnh sửa thông tin công hàng (Item 22) */}
      {editingCongHangModal && (
        <EditCongHangModal
          open={!!editingCongHangModal}
          onOpenChange={(open) => !open && setEditingCongHangModal(null)}
          congHang={editingCongHangModal}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Popup lịch sử tiến độ công đoạn (Item 18) */}
      {historyCongHangModal && (
        <HistoryCongDoanModal
          open={!!historyCongHangModal}
          onOpenChange={(open) => !open && setHistoryCongHangModal(null)}
          congHang={historyCongHangModal}
          congDoanList={congDoanList}
          congNhanList={congNhanList}
          onPreviewImage={(url) => setPreviewImage(url)}
        />
      )}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors z-[110]"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImage} 
            alt="Preview enlarged" 
            className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
