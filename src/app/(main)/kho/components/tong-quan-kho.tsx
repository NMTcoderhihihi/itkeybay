"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { getTongQuanTonKho, getSoCaiChiTietPaginated, getDanhSachDanhMuc, TrangThaiLocSoCai, getSoCaiChiTiet } from "@/app/actions/giao-dich"
import { getTaiKhoan } from "@/app/actions/nhan-su"
import { getCongHangList } from "@/app/actions/san-xuat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PackageSearch, FileText, ChevronDown, TrendingUp, TrendingDown, Loader2, X, Image as ImageIcon, Search, ArrowLeft, History, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

function formatSafeDate(dateVal: any, fmt: string = "dd/MM/yyyy HH:mm"): string {
  if (!dateVal) return "---";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "---";
  try {
    return format(d, fmt);
  } catch (e) {
    return "---";
  }
}

export function TongQuanKho({ initialData = [] }: { initialData?: any[] }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<any[]>(initialData)
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'quy_cach' | 'lich_su'>('quy_cach')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Ledger Pagination and Filter
  const [currentLedgerData, setCurrentLedgerData] = useState<any[]>([])
  const [totalLedgerRows, setTotalLedgerRows] = useState(0)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [showFilters, setShowFilters] = useState(false)
  const [latestTransactions, setLatestTransactions] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState<TrangThaiLocSoCai>({
    ma_quy_cach: 'ALL',
    tu_ngay: '',
    den_ngay: '',
    id_tai_khoan: 'ALL',
    id_cong_hang: 'ALL',
    id_danh_muc: 'ALL',
  })
  
  // Filter Options
  const [danhMucList, setDanhMucList] = useState<any[]>([])
  const [taiKhoanList, setTaiKhoanList] = useState<any[]>([])
  const [congHangList, setCongHangList] = useState<any[]>([])
  
  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    setInventory(initialData)
  }, [initialData])

  useEffect(() => {
    Promise.all([
      getDanhSachDanhMuc(),
      getTaiKhoan(),
      getCongHangList()
    ]).then(([dm, tk, ch]) => {
      setDanhMucList(dm)
      setTaiKhoanList(tk)
      setCongHangList(ch)
    })
  }, [])

  const openItemDetails = async (item: any) => {
    setSelectedItem(item)
    setViewMode('quy_cach')
    setSearchQuery('')
    setCurrentLedgerData([])
    setLatestTransactions({})
    setLoadingDetails(true)

    const soCaiList = await getSoCaiChiTiet(item.id)
    const latest: Record<string, any> = {}
    soCaiList.forEach((sc: any) => {
      if (!latest[sc.ma_quy_cach]) {
        latest[sc.ma_quy_cach] = sc
      }
    })
    setLatestTransactions(latest)
    setLoadingDetails(false)
  }

  const fetchLedger = async (id: string, page: number, currentFilters: TrangThaiLocSoCai) => {
    setLoadingLedger(true)
    const { data, total } = await getSoCaiChiTietPaginated(id, page, ITEMS_PER_PAGE, currentFilters)
    setCurrentLedgerData(data)
    setTotalLedgerRows(total)
    setLoadingLedger(false)
  }

  const loadMoreLedger = async (id: string, page: number, currentFilters: TrangThaiLocSoCai) => {
    setLoadingLedger(true)
    const { data, total } = await getSoCaiChiTietPaginated(id, page, ITEMS_PER_PAGE, currentFilters)
    setCurrentLedgerData(prev => [...prev, ...data])
    setTotalLedgerRows(total)
    setLoadingLedger(false)
  }

  const handleScrollLedger = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // Nếu cuộn gần tới cuối (cách 100px) và chưa tải hết, chưa đang tải
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loadingLedger) {
      const totalPages = Math.ceil(totalLedgerRows / ITEMS_PER_PAGE)
      if (currentPage < totalPages) {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        if (selectedItem) {
          loadMoreLedger(selectedItem.id, nextPage, filters)
        }
      }
    }
  }

  const handleOpenHistory = (id_nguyen_lieu: string, ma_quy_cach: string | null) => {
    const initFilters = {
      ...filters,
      ma_quy_cach: ma_quy_cach || 'ALL'
    }
    setFilters(initFilters)
    setViewMode('lich_su')
    setCurrentPage(1)
    fetchLedger(id_nguyen_lieu, 1, initFilters)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    if (selectedItem) {
      fetchLedger(selectedItem.id, 1, filters)
    }
  }

  const handleResetFilters = () => {
    const defaultFilters: TrangThaiLocSoCai = {
      ma_quy_cach: filters.ma_quy_cach || 'ALL', // Keep current quy_cach
      tu_ngay: '',
      den_ngay: '',
      id_tai_khoan: 'ALL',
      id_cong_hang: 'ALL',
      id_danh_muc: 'ALL',
    }
    setFilters(defaultFilters)
    setCurrentPage(1)
    if (selectedItem) {
      fetchLedger(selectedItem.id, 1, defaultFilters)
    }
  }

  const goToPage = (page: number) => {
    // Không dùng goToPage nữa do đã chuyển sang Infinite scroll
  }

  // Ref để giữ trạng thái hiện tại của Modal phục vụ đồng bộ Realtime
  const modalStateRef = useRef({ selectedItem, viewMode, currentPage, filters })
  useEffect(() => {
    modalStateRef.current = { selectedItem, viewMode, currentPage, filters }
  }, [selectedItem, viewMode, currentPage, filters])

  useEffect(() => {
    // Đồng bộ Realtime cho Popup nếu đang mở khi dữ liệu mới được đẩy từ Server (thông qua useRealtimeSSE -> router.refresh)
    const { selectedItem: currentItem, viewMode: currentView, currentPage: currPage, filters: currFilters } = modalStateRef.current;
    if (currentItem) {
      const freshItem = initialData?.find(item => item.id === currentItem.id);
      if (freshItem) {
        setSelectedItem(freshItem); // Tự động cập nhật số lượng tồn kho trong popup
        
        // Cập nhật lại giao dịch gần nhất ngầm
        getSoCaiChiTiet(freshItem.id).then(soCaiList => {
          const latest: Record<string, any> = {}
          soCaiList.forEach((sc: any) => {
            if (!latest[sc.ma_quy_cach]) {
              latest[sc.ma_quy_cach] = sc
            }
          })
          setLatestTransactions(latest)
        }).catch(() => {})

        // Tự động load mới lịch sử giao dịch (sổ cái) nếu đang mở popup ở dạng lịch sử
        if (currentView === 'lich_su' && currPage === 1) {
          fetchLedger(freshItem.id, 1, currFilters).catch(() => {});
        }
      }
    }
  }, [initialData])

  // Filtered quy cach
  const filteredQuyCach = useMemo(() => {
    if (!selectedItem) return []
    return selectedItem.danh_sach_quy_cach.filter((qc: any) => 
      qc.ten.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [selectedItem, searchQuery])

  const totalPages = Math.max(1, Math.ceil(totalLedgerRows / ITEMS_PER_PAGE))

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">{t('inventory.loadingStock')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dạng lưới hiển thị tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {inventory.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col"
            onClick={() => openItemDetails(item)}
          >
            <div className="h-32 bg-muted relative border-b">
              {item.anh_minh_hoa ? (
                <Image src={item.anh_minh_hoa} alt={item.ten_nguyen_lieu} fill className="object-contain p-1" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <PackageSearch className="h-10 w-10 opacity-20" />
                </div>
              )}
            </div>
            <CardContent className="p-4 flex-1 flex flex-col justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight line-clamp-2" title={item.ten_nguyen_lieu}>{item.ten_nguyen_lieu}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('inventory.unit')}: {item.don_vi}</p>
              </div>
              <div className="mt-auto border-t pt-2">
                <p className="text-sm font-medium text-primary">
                  Số lượng quy cách: {item.danh_sach_quy_cach?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {inventory.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            {t('inventory.noStockData')}
          </div>
        )}
      </div>

      {/* Modal hiển thị chi tiết (Quy cách hoặc Lịch sử) */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent 
          className="w-[95vw] sm:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          initialFocus={false}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewMode === 'lich_su' ? (
                <Button variant="ghost" size="icon" onClick={() => setViewMode('quy_cach')} className="mr-2 h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
              {viewMode === 'quy_cach' ? t('warehouse.specifications') : t('inventory.ledgerTitle')}: 
              <span className="text-primary">{selectedItem?.ten_nguyen_lieu}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            {viewMode === 'quy_cach' ? (
              // VIEW 1: DANH SÁCH QUY CÁCH
              <div className="flex flex-col h-full overflow-hidden relative">
                {loadingDetails && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground font-medium">Đang tải chi tiết tồn kho...</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4 gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={t("warehouse.searchMaterial")}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => handleOpenHistory(selectedItem.id, null)} className="gap-2">
                    <History className="h-4 w-4" />
                    Xem toàn bộ lịch sử
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("warehouse.specifications")}</TableHead>
                        <TableHead className="text-right">{t("warehouse.currentStock")}</TableHead>
                        <TableHead className="text-right">Giao dịch gần nhất</TableHead>
                        <TableHead className="text-right">Hành Động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuyCach.map((qc: any, i: number) => {
                        const lastTx = latestTransactions[qc.ma_quy_cach]
                        return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{qc.ten}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={qc.ton_kho > 0 ? "default" : "destructive"}>
                              {qc.ton_kho} {selectedItem.don_vi}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {lastTx ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <span
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                      Number(lastTx.bien_dong_so_luong) > 0
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {Number(lastTx.bien_dong_so_luong) > 0 ? "+" : ""}
                                    {lastTx.bien_dong_so_luong} {selectedItem.don_vi}
                                  </span>
                                  <span
                                    className="text-foreground font-medium truncate max-w-[130px]"
                                    title={lastTx.lo_giao_dich?.tai_khoan?.ho_ten || "Hệ thống"}
                                  >
                                    {lastTx.lo_giao_dich?.tai_khoan?.ho_ten || "Hệ thống"}
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {formatSafeDate(
                                    lastTx.lo_giao_dich?.ngay_tao || lastTx.created_at || lastTx.ngay_tao
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="italic text-muted-foreground">
                                {t("warehouse.noData")}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary" onClick={() => handleOpenHistory(selectedItem.id, qc.ma_quy_cach)}>
                              <History className="h-4 w-4" />
                              {t("warehouse.transactionHistory")}
                            </Button>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                      {filteredQuyCach.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            {t("warehouse.noData")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              // VIEW 2: LỊCH SỬ SỔ CÁI
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                
                {/* Thanh công cụ lọc */}
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-muted-foreground">Danh sách biến động</h3>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                      <Filter className="h-4 w-4" />
                      {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    </Button>
                  </div>
                  
                  {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/20 border rounded-md">
                      {/* Lọc Quy cách */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">{t("warehouse.specifications")}</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={filters.ma_quy_cach}
                          onChange={(e) => setFilters(f => ({ ...f, ma_quy_cach: e.target.value }))}
                        >
                          <option value="ALL">Tất cả quy cách</option>
                          {selectedItem?.danh_sach_quy_cach?.map((qc: any) => (
                            <option key={qc.ma_quy_cach} value={qc.ma_quy_cach}>{qc.ten}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Lọc Từ ngày */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
                        <Input 
                          type="date" 
                          className="h-9"
                          value={filters.tu_ngay}
                          onChange={(e) => setFilters(f => ({ ...f, tu_ngay: e.target.value }))}
                        />
                      </div>

                      {/* Lọc Đến ngày */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
                        <Input 
                          type="date" 
                          className="h-9"
                          value={filters.den_ngay}
                          onChange={(e) => setFilters(f => ({ ...f, den_ngay: e.target.value }))}
                        />
                      </div>

                      {/* Lọc Nhân viên */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Người thực hiện</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={filters.id_tai_khoan}
                          onChange={(e) => setFilters(f => ({ ...f, id_tai_khoan: e.target.value }))}
                        >
                          <option value="ALL">Tất cả nhân viên</option>
                          {taiKhoanList.map(tk => (
                            <option key={tk.id} value={tk.id}>{tk.ho_ten}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lọc Công hàng */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Công hàng</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={filters.id_cong_hang}
                          onChange={(e) => setFilters(f => ({ ...f, id_cong_hang: e.target.value }))}
                        >
                          <option value="ALL">Tất cả công hàng</option>
                          {congHangList.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.ma_cong_hang} - {ch.ten_san_pham}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lọc Danh mục */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Loại giao dịch</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={filters.id_danh_muc}
                          onChange={(e) => setFilters(f => ({ ...f, id_danh_muc: e.target.value }))}
                        >
                          <option value="ALL">Tất cả loại giao dịch</option>
                          {danhMucList.map(dm => (
                            <option key={dm.id} value={dm.id}>{dm.ten_danh_muc}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-full flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={handleResetFilters}>Đặt lại</Button>
                        <Button size="sm" onClick={handleApplyFilters}>Lọc dữ liệu</Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto border rounded-md min-h-[300px] relative" onScroll={handleScrollLedger}>
                  {loadingLedger && currentPage === 1 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground font-medium">Đang tải sổ cái...</p>
                    </div>
                  )}
                  
                  <Table className="min-w-[850px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('inventory.date')}</TableHead>
                          <TableHead>Người thực hiện</TableHead>
                          <TableHead>{t('inventory.reason')}</TableHead>
                          <TableHead>{t('inventory.spec')}</TableHead>
                          <TableHead className="text-right">{t('inventory.change')}</TableHead>
                          <TableHead className="text-right">{t('inventory.balance')}</TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead className="text-center">Minh chứng</TableHead>
                          <TableHead className="text-right">{t('inventory.code')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentLedgerData.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell className="whitespace-nowrap text-xs">
                              {formatSafeDate(row.created_at)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium text-xs">
                              {row.lo_giao_dich?.tai_khoan?.ho_ten || 'Hệ thống'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {row.lo_giao_dich?.danh_muc_giao_dich?.ten_danh_muc || 'Không xác định'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {selectedItem?.danh_sach_quy_cach?.find((qc: any) => qc.ma_quy_cach === row.ma_quy_cach)?.ten || row.ma_quy_cach}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`flex items-center justify-end gap-1 ${row.bien_dong_so_luong > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {row.bien_dong_so_luong > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                <span className="font-bold">{row.bien_dong_so_luong > 0 ? '+' : ''}{row.bien_dong_so_luong}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {row.ton_kho_hien_tai}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={row.lo_giao_dich?.ghi_chu || ''}>
                              {row.lo_giao_dich?.ghi_chu || '-'}
                            </TableCell>
                            <TableCell>
                              {row.lo_giao_dich?.danh_sach_anh?.length > 0 ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap w-16">
                                  {row.lo_giao_dich.danh_sach_anh.map((url: string, i: number) => (
                                    <div 
                                      key={i} 
                                      className="relative w-6 h-6 border rounded overflow-hidden cursor-pointer hover:border-primary"
                                      onClick={() => setPreviewImage(url)}
                                    >
                                      <Image src={url} alt="Evidence" fill className="object-cover" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground opacity-50">
                                  -
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-muted-foreground">
                              {row.lo_giao_dich?.ma_lo || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {currentLedgerData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              {t('inventory.noHistory')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>
                
                {/* Hiển thị Loading khi cuộn tải thêm */}
                {loadingLedger && currentPage > 1 && (
                  <div className="flex justify-center items-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Đang tải thêm...</span>
                  </div>
                )}
                
                {/* Trạng thái dữ liệu Server-side */}
                {!loadingLedger && currentLedgerData.length > 0 && currentLedgerData.length === totalLedgerRows && (
                  <div className="text-center py-3 text-sm text-muted-foreground border-t mt-2">
                    Đã hiển thị toàn bộ {totalLedgerRows} bản ghi
                  </div>
                )}
                {!loadingLedger && currentLedgerData.length > 0 && currentLedgerData.length < totalLedgerRows && (
                  <div className="text-center py-3 text-sm text-muted-foreground border-t mt-2">
                    Hiển thị {currentLedgerData.length} / {totalLedgerRows} bản ghi (Cuộn xuống để xem thêm)
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
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
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
