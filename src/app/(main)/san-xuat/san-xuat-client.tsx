"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translation"
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
import { Factory, Package, ListTodo, CheckCircle2, Play, Truck, User, Search, Filter, ArrowLeft, Loader2, X, ChevronDown, MoreVertical, LayoutGrid, Table as TableIcon, Edit, Trash2, History, Clock, FileSpreadsheet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { EditCongHangModal } from "./components/edit-cong-hang-modal"
import { HistoryCongDoanModal } from "./components/history-cong-doan-modal"
import { CongHangDetailView } from "./components/cong-hang-detail-view"
import { ImportCongHangModal } from "./components/import-cong-hang-modal"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { getLichSuPhatLieu, deleteCongHang } from "@/app/actions/san-xuat"
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
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("cong-hang")
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [editingCongHangModal, setEditingCongHangModal] = useState<any | null>(null)
  const [historyCongHangModal, setHistoryCongHangModal] = useState<any | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

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
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  

  const [loadingAction, setLoadingAction] = useState(false)
    
  // Edit mode state
          
  // Final Completion State
      
  // Giao Hang (Xuất BTP) State
          
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

  const handleOpenDetail = (ch: CongHang) => {
    router.push(`/san-xuat/${ch.id}`)
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


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-2">
        {activeTab === "cong-hang" && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none border-primary/20 text-primary hover:bg-primary/5" onClick={() => setShowImportModal(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import
            </Button>
            <CongHangForm congDoanList={congDoanList} />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full md:w-[400px] ${isManager ? "grid-cols-2" : "grid-cols-1"}`}>
          <TabsTrigger value="cong-hang">{t("production.tabOrders")}</TabsTrigger>
          {isManager && <TabsTrigger value="cong-doan">{t("production.tabStages")}</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="cong-hang" className="mt-6">
          <div className="flex flex-col gap-4">
            
            {/* Thanh Công cụ Lọc */}
            <div className="flex flex-col gap-3 bg-muted/20 p-3 sm:p-4 rounded-xl border">
              
              {/* Hàng 1: Search + Nút Filter + Nút Chế độ hiển thị */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tìm mã công, mã hàng..."
                      className="pl-9 bg-background h-9 sm:h-10 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant={showFilters ? "secondary" : "outline"} 
                    onClick={() => setShowFilters(!showFilters)} 
                    className="gap-1.5 shrink-0 h-9 sm:h-10 bg-background relative px-3 sm:px-4"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">{showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}</span>
                    {(!showFilters && (filterStatus.length !== 3 || filterKhoStatus.length !== 2 || filterWorker.length > 0)) && (
                      <span className="absolute top-1.5 right-1.5 sm:static sm:ml-1 flex h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/40"></span>
                    )}
                  </Button>
                </div>
                
                {/* View Mode Toggle luôn hiện */}
                <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    Hiển thị <span className="font-semibold text-foreground">{filteredList.length}</span> công hàng
                  </div>
                  <div className="flex items-center gap-1 border rounded-lg p-1 bg-background/60 shadow-sm">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 shadow-none"
                      onClick={() => setViewMode('card')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("production.viewCard")}</span>
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1 shadow-none"
                      onClick={() => setViewMode('table')}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("production.viewTable")}</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Hàng 2: Các bộ lọc (chỉ hiện khi showFilters) */}
              {showFilters && (
                <div className="flex flex-wrap items-center justify-start gap-3 pt-3 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="h-9 w-full sm:w-auto min-w-[180px] justify-between font-normal bg-background">
                          <span className="truncate text-sm">
                            {filterStatus.length === 0 ? t("production.statusAll") : `${t("production.statusAll")} (${filterStatus.length})`}
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
                        {t("production.statusChuaLam")}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filterStatus.includes('DANG_LAM')}
                        onCheckedChange={() => toggleStatusFilter('DANG_LAM')}
                      >
                        {t("production.statusDangLam")}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filterStatus.includes('DA_LAM')}
                        onCheckedChange={() => toggleStatusFilter('DA_LAM')}
                      >
                        {t("production.statusDaLam")}
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="h-9 w-full sm:w-auto min-w-[180px] justify-between font-normal bg-background">
                          <span className="truncate text-sm">
                            {filterKhoStatus.length === 0 ? t("production.filterWarehouse") : `${t("production.filterWarehouse")} (${filterKhoStatus.length})`}
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
                        {t("production.notImported")}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filterKhoStatus.includes('TON_KHO')}
                        onCheckedChange={() => toggleKhoStatusFilter('TON_KHO')}
                      >
                        {t("production.inStock")}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filterKhoStatus.includes('DA_GIAO')}
                        onCheckedChange={() => toggleKhoStatusFilter('DA_GIAO')}
                      >
                        {t("production.delivered")}
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="h-9 w-full sm:w-auto min-w-[200px] justify-between font-normal bg-background">
                          <span className="truncate text-sm">
                            {filterWorker.length === 0 ? t("production.allWorkers") : `${t("production.selectedWorkers")} ${filterWorker.length} ${t("production.workers")}`}
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
                          {cn.ho_ten} - {cn.vai_tro || "Công nhân"} ({cn.ma_cong_nhan})
                        </DropdownMenuCheckboxItem>
                      ))}
                      {congNhanList.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">{t("production.noData")}</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bộ lọc nhanh Trạng thái công hàng */}
                  <div className="flex flex-wrap items-center gap-1.5 w-full pt-1">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">{t("production.status")}:</span>
                    {[
                      { label: t('production.statusAll'), value: 'ALL' },
                      { label: t('production.statusChuaLam'), value: 'CHUA_LAM' },
                      { label: t('production.statusDangLam'), value: 'DANG_LAM' },
                      { label: t('production.statusDaLam'), value: 'DA_LAM' }
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
                </div>
              )}
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
                    {t("production.noOrders")}
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
                            {t("production.noOrders")}
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

        {isManager && (
          <TabsContent value="cong-doan" className="mt-3 sm:mt-6">
            <CongDoanManager initialData={congDoanList} />
          </TabsContent>
        )}
      </Tabs>


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

      {/* Import Modal */}
      {showImportModal && (
        <ImportCongHangModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          congDoanList={congDoanList}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
