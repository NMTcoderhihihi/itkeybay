"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { ArrowLeft, Clock, Package, FileText, User, Search, Plus, SlidersHorizontal } from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { vi } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFreeInventoryForMaterial, allocateFreeInventory, getAllocatedInventoryForMaterial, withdrawAllocatedInventory } from "@/app/actions/don-tong"
import { toast } from "sonner"

export function ChiTietDonTongClient({ donTong, giaoDichList }: { donTong: any, giaoDichList: any[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Search History State
  const [historySearchTerm, setHistorySearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Popup State
  const [allocatingMaterial, setAllocatingMaterial] = useState<any>(null)
  const [freeInventory, setFreeInventory] = useState<any[]>([])
  const [allocatedInventory, setAllocatedInventory] = useState<any[]>([])
  const [allocInputs, setAllocInputs] = useState<Record<string, string>>({})
  const [withdrawInputs, setWithdrawInputs] = useState<Record<string, string>>({})
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [popupTab, setPopupTab] = useState("add")

  // Popup UI State
  const [isFetchingInventory, setIsFetchingInventory] = useState(false)
  const [popupSearchTerm, setPopupSearchTerm] = useState("")
  const [popupDateFrom, setPopupDateFrom] = useState("")
  const [popupDateTo, setPopupDateTo] = useState("")
  const [popupPage, setPopupPage] = useState(1)
  const ITEMS_PER_POPUP_PAGE = 10

  const handleScrollPopup = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setPopupPage(p => p + 1)
    }
  }

  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), "HH:mm - dd/MM/yyyy", { locale: vi })
    } catch {
      return ts
    }
  }

  const handleOpenPopup = async (ct: any) => {
    setAllocatingMaterial(ct)
    setIsPopupOpen(true)
    setPopupTab("add")
    setFreeInventory([])
    setAllocatedInventory([])
    setAllocInputs({})
    setWithdrawInputs({})
    
    // Fetch both free and allocated parallel
    const [free, allocated] = await Promise.all([
      getFreeInventoryForMaterial(ct.id_nguyen_lieu, ct.ma_quy_cach),
      getAllocatedInventoryForMaterial(ct.id)
    ])
    setFreeInventory(free)
    setAllocatedInventory(allocated)
  }

  const handleAllocChange = (id_so_cai_vat_tu: string, value: string, maxFree: number) => {
    const numValue = Number(value)
    if (numValue < 0) return
    if (numValue > maxFree) return
    setAllocInputs(prev => ({ ...prev, [id_so_cai_vat_tu]: value }))
  }

  const handleWithdrawChange = (id_cap_phat: string, value: string, maxAllocated: number) => {
    const numValue = Number(value)
    if (numValue < 0) return
    if (numValue > maxAllocated) return
    setWithdrawInputs(prev => ({ ...prev, [id_cap_phat]: value }))
  }

  const handleSubmitAllocation = async () => {
    if (!allocatingMaterial) return
    const missing = Number(allocatingMaterial.so_luong_yeu_cau) - Number(allocatingMaterial.so_luong_da_nhap)
    let totalAllocating = 0
    const allocations: any[] = []

    for (const [id_so_cai, val] of Object.entries(allocInputs)) {
      const num = Number(val)
      if (num > 0) {
        allocations.push({ id_so_cai_vat_tu: id_so_cai, so_luong: num })
        totalAllocating += num
      }
    }

    if (allocations.length === 0) {
      return toast.error("Vui lòng nhập số lượng muốn cấp phát.")
    }
    if (totalAllocating > missing) {
      return toast.error(`Bạn đang cấp dư. Đơn chỉ còn thiếu ${missing}.`)
    }

    setIsSubmitting(true)
    const res = await allocateFreeInventory(allocatingMaterial.id, allocations, donTong.id)
    setIsSubmitting(false)

    if (res.success) {
      setIsPopupOpen(false)
      toast.success("Cấp phát thành công!")
      router.refresh()
    } else {
      toast.error("Lỗi: " + res.error)
    }
  }

  const handleSubmitWithdrawal = async () => {
    if (!allocatingMaterial) return
    let totalWithdrawing = 0
    const withdrawals: any[] = []

    for (const [id_cp, val] of Object.entries(withdrawInputs)) {
      const num = Number(val)
      if (num > 0) {
        withdrawals.push({ id_cap_phat: id_cp, so_luong_rut: num })
        totalWithdrawing += num
      }
    }

    if (withdrawals.length === 0) {
      return toast.error("Vui lòng nhập số lượng muốn rút.")
    }

    setIsSubmitting(true)
    const res = await withdrawAllocatedInventory(withdrawals, donTong.id)
    setIsSubmitting(false)

    if (res.success) {
      setIsPopupOpen(false)
      toast.success("Rút vật tư thành công!")
      router.refresh()
    } else {
      toast.error("Lỗi: " + res.error)
    }
  }

    const filteredFreeInventory = useMemo(() => {
    return freeInventory.filter(item => {
      let matchSearch = true
      if (popupSearchTerm) {
        const s = popupSearchTerm.toLowerCase()
        matchSearch = item.ma_lo?.toLowerCase().includes(s) || 
                      item.nguoi_tao?.toLowerCase().includes(s) || 
                      item.ghi_chu?.toLowerCase().includes(s)
      }
      let matchDate = true
      if (popupDateFrom || popupDateTo) {
        const d = new Date(item.ngay_tao)
        const f = popupDateFrom ? startOfDay(new Date(popupDateFrom)) : new Date(0)
        const t = popupDateTo ? endOfDay(new Date(popupDateTo)) : new Date(2100, 1, 1)
        matchDate = isWithinInterval(d, { start: f, end: t })
      }
      return matchSearch && matchDate
    })
  }, [freeInventory, popupSearchTerm, popupDateFrom, popupDateTo])

  const visibleFreeInventory = filteredFreeInventory.slice(0, popupPage * ITEMS_PER_POPUP_PAGE)

  const filteredAllocatedInventory = useMemo(() => {
    return allocatedInventory.filter(item => {
      let matchSearch = true
      if (popupSearchTerm) {
        const s = popupSearchTerm.toLowerCase()
        matchSearch = item.ma_lo?.toLowerCase().includes(s) || 
                      item.nguoi_tao?.toLowerCase().includes(s) || 
                      item.ghi_chu?.toLowerCase().includes(s)
      }
      let matchDate = true
      if (popupDateFrom || popupDateTo) {
        const d = new Date(item.ngay_tao)
        const f = popupDateFrom ? startOfDay(new Date(popupDateFrom)) : new Date(0)
        const t = popupDateTo ? endOfDay(new Date(popupDateTo)) : new Date(2100, 1, 1)
        matchDate = isWithinInterval(d, { start: f, end: t })
      }
      return matchSearch && matchDate
    })
  }, [allocatedInventory, popupSearchTerm, popupDateFrom, popupDateTo])

  const visibleAllocatedInventory = filteredAllocatedInventory.slice(0, popupPage * ITEMS_PER_POPUP_PAGE)

  const filteredDetails = donTong.don_tong_chi_tiet?.filter((ct: any) => {
    const nl = ct.nguyen_lieu
    const quyCachObj = nl?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === ct.ma_quy_cach)
    const nameStr = (nl?.ten_nguyen_lieu || "").toLowerCase()
    const qcStr = (quyCachObj?.ten || ct.ma_quy_cach || "").toLowerCase()
    const search = searchTerm.toLowerCase()
    return nameStr.includes(search) || qcStr.includes(search)
  })

  const filteredHistory = useMemo(() => {
    return giaoDichList.filter(gd => {
      let matchSearch = true
      if (historySearchTerm) {
        const s = historySearchTerm.toLowerCase()
        const matchLo = gd.ma_lo?.toLowerCase().includes(s)
        const matchNote = gd.ghi_chu?.toLowerCase().includes(s)
        const matchMaterial = gd.so_cai_vat_tu?.some((sc: any) => {
          const qcObj = Array.isArray(sc.nguyen_lieu?.danh_sach_quy_cach) ? sc.nguyen_lieu.danh_sach_quy_cach.find((q: any) => q.ma_quy_cach === sc.ma_quy_cach) : null
          return sc.nguyen_lieu?.ten_nguyen_lieu?.toLowerCase().includes(s) || qcObj?.ten?.toLowerCase().includes(s)
        })
        matchSearch = matchLo || matchNote || matchMaterial
      }

      let matchDate = true
      if (dateFrom || dateTo) {
        const gdDate = new Date(gd.ngay_tao)
        const f = dateFrom ? startOfDay(new Date(dateFrom)) : new Date(0)
        const t = dateTo ? endOfDay(new Date(dateTo)) : new Date(2100, 1, 1)
        matchDate = isWithinInterval(gdDate, { start: f, end: t })
      }

      return matchSearch && matchDate
    })
  }, [giaoDichList, historySearchTerm, dateFrom, dateTo])

  const orderDetailIds = useMemo(() => {
    return donTong.don_tong_chi_tiet?.map((ct: any) => ct.id) || []
  }, [donTong])

  return (
    <div className="flex flex-col gap-6 p-6 h-full max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{donTong.ma_don_tong}</h1>
            <Badge variant={donTong.trang_thai === 'DA_DU' ? 'default' : 'secondary'} className={donTong.trang_thai === 'DA_DU' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
              {donTong.trang_thai === 'DA_DU' ? t("masterOrder.statusEnough") : t("masterOrder.statusNotEnough")}
            </Badge>
          </div>
          {donTong.ten_don && <p className="text-muted-foreground mt-1">{donTong.ten_don}</p>}
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Thông tin chung
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t("masterOrder.createdAt")}</p>
            <p className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {formatTime(donTong.ngay_tao)}
            </p>
          </div>
          {donTong.ghi_chu && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("inventory.note")}</p>
              <div className="bg-muted/40 p-2 rounded-md text-sm">
                {donTong.ghi_chu}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("masterOrder.detailsProgress")}
          </CardTitle>
          <div className="relative w-full md:w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Tìm tên hoặc quy cách vật tư..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 focus:bg-background transition-colors"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {filteredDetails?.length === 0 ? (
              <div className="col-span-full text-center p-8 text-muted-foreground">Không tìm thấy vật tư nào phù hợp.</div>
            ) : (
              filteredDetails?.map((ct: any) => {
                const y = Number(ct.so_luong_yeu_cau)
                const d = Number(ct.so_luong_da_nhap)
                const rawPct = Number(((d / y) * 100).toFixed(2))
                const pct = y > 0 ? (d >= y ? 100 : Math.min(99.99, rawPct)) : 0
                
                const quyCachObj = ct.nguyen_lieu?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === ct.ma_quy_cach)
                
                return (
                  <div key={ct.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors shadow-sm overflow-hidden">
                    <div className="flex-1 space-y-3 w-full min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 w-full">
                          <h3 className="font-semibold text-lg text-foreground truncate">{ct.nguyen_lieu?.ten_nguyen_lieu}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {quyCachObj?.ten && (
                              <Badge variant="outline" className="bg-background text-xs font-normal max-w-full truncate block">
                                Quy cách: {quyCachObj.ten}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-muted text-xs font-normal whitespace-nowrap">
                              Mã: {ct.ma_quy_cach}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                        <div className="grid grid-cols-2 sm:flex sm:gap-6 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Yêu cầu</span>
                            <div className="font-semibold text-base">{y} <span className="text-xs text-muted-foreground font-normal">{ct.nguyen_lieu?.don_vi}</span></div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Đã nhập</span>
                            <div className="font-semibold text-base text-primary">{d} <span className="text-xs text-muted-foreground font-normal">{ct.nguyen_lieu?.don_vi}</span></div>
                          </div>
                        </div>
                        
                        {d < y ? (
                          <div className="text-sm bg-destructive/10 text-destructive px-3 py-1.5 rounded-md font-medium border border-destructive/20 inline-flex items-center w-fit whitespace-nowrap">
                            Đang thiếu: {y - d} {ct.nguyen_lieu?.don_vi}
                          </div>
                        ) : d > y ? (
                          <div className="text-sm bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-md font-medium border border-amber-500/20 inline-flex items-center w-fit whitespace-nowrap">
                            Dư vật tư: {d - y} {ct.nguyen_lieu?.don_vi}
                          </div>
                        ) : (
                          <div className="text-sm bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md font-medium border border-emerald-500/20 inline-flex items-center w-fit whitespace-nowrap">
                            Đã nhận đủ hàng
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" onClick={() => handleOpenPopup(ct)} className="w-full sm:w-auto">
                        <SlidersHorizontal className="w-4 h-4 mr-1" /> Điều chỉnh
                      </Button>
                      <CircularProgressRing progress={pct} size={56} strokeWidth={4} />
                    </div>
                  </div>
                )
              })
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Lịch sử giao dịch liên quan
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full sm:w-[140px] h-9 text-sm" />
            <span className="text-muted-foreground text-sm">-</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full sm:w-[140px] h-9 text-sm" />
            <div className="relative w-full sm:w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Tìm mã lô, vật tư..." 
                value={historySearchTerm}
                onChange={e => setHistorySearchTerm(e.target.value)}
                className="pl-9 h-9 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-6 pt-0">
            {filteredHistory.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Chưa có giao dịch nào liên kết với đơn tổng này.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Hình ảnh</TableHead>
                    <TableHead className="w-[140px]">Mã lô</TableHead>
                    <TableHead className="w-[150px]">Loại & Ghi chú</TableHead>
                    <TableHead className="w-[180px]">Thời gian & Người tạo</TableHead>
                    <TableHead>Chi tiết vật tư</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map(gd => (
                    <TableRow key={gd.id} className="align-top">
                      <TableCell>
                        {gd.danh_sach_anh && gd.danh_sach_anh.length > 0 ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={gd.danh_sach_anh[0]} className="w-12 h-12 object-cover rounded-md border shadow-sm" alt="gd" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground border">No img</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {gd.ma_lo}
                      </TableCell>
                      <TableCell>
                        <Badge variant={gd.danh_muc_giao_dich?.loai_giao_dich === 'NHAP' ? 'default' : 'secondary'} className="mb-1">
                          {gd.danh_muc_giao_dich?.ten_danh_muc}
                        </Badge>
                        {gd.ghi_chu && <div className="text-xs text-muted-foreground italic line-clamp-2 mt-1">{gd.ghi_chu}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{formatTime(gd.ngay_tao)}</span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            {gd.tai_khoan?.ho_ten}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5 bg-muted/10 p-2 rounded-md border min-w-[350px]">
                          {gd.so_cai_vat_tu?.length > 0 ? (
                            gd.so_cai_vat_tu.map((sc: any, idx: number) => {
                              const qcArray = Array.isArray(sc.nguyen_lieu?.danh_sach_quy_cach) ? sc.nguyen_lieu.danh_sach_quy_cach : [];
                              const qcObj = qcArray.find((q: any) => q.ma_quy_cach === sc.ma_quy_cach);
                              const sl = Math.abs(Number(sc.bien_dong_so_luong) || 0);
                              
                              const cpForThisOrder = sc.chi_tiet_cap_phat?.filter((cp: any) => orderDetailIds.includes(cp.id_don_tong_chi_tiet)).reduce((sum: number, cp: any) => sum + Number(cp.so_luong_cap_phat), 0) || 0;
                              
                              return (
                                <div key={idx} className="flex flex-col gap-1 text-sm py-2 border-b border-border/40 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="font-medium text-foreground truncate">{sc.nguyen_lieu?.ten_nguyen_lieu}</span>
                                      {qcObj?.ten && <span className="text-[11px] text-muted-foreground bg-background border px-1.5 py-0.5 rounded truncate">{qcObj.ten}</span>}
                                    </div>
                                    <div className="font-semibold tabular-nums shrink-0 text-muted-foreground">
                                      Tổng lô: {sl}
                                    </div>
                                  </div>
                                  {cpForThisOrder > 0 && (
                                    <div className="flex justify-end text-emerald-600 text-xs font-semibold">
                                      Thực cấp: +{cpForThisOrder} {sc.nguyen_lieu?.don_vi}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Không có chi tiết</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-xl">Điều chỉnh vật tư Đơn Tổng</DialogTitle>
          </DialogHeader>
          
          {allocatingMaterial && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 pb-0 shrink-0">
                <div className="flex items-center justify-between mb-4 bg-muted/40 p-4 rounded-xl border">
                  <div>
                    <h4 className="font-bold text-lg text-primary">{allocatingMaterial.nguyen_lieu?.ten_nguyen_lieu}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-background">Mã: {allocatingMaterial.ma_quy_cach}</Badge>
                      {allocatingMaterial.nguyen_lieu?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === allocatingMaterial.ma_quy_cach)?.ten && (
                        <span className="text-sm text-muted-foreground">Quy cách: {allocatingMaterial.nguyen_lieu?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === allocatingMaterial.ma_quy_cach)?.ten}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right bg-background p-3 rounded-lg border shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Tiến độ nhập kho</p>
                    <p className="text-base"><span className="font-bold text-primary text-xl">{allocatingMaterial.so_luong_da_nhap}</span> / {allocatingMaterial.so_luong_yeu_cau} <span className="text-sm text-muted-foreground">{allocatingMaterial.nguyen_lieu?.don_vi}</span></p>
                    {Number(allocatingMaterial.so_luong_da_nhap) < Number(allocatingMaterial.so_luong_yeu_cau) && (
                      <p className="text-sm font-semibold text-destructive mt-1 flex items-center justify-end gap-1">
                        Đang thiếu: {Number(allocatingMaterial.so_luong_yeu_cau) - Number(allocatingMaterial.so_luong_da_nhap)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thanh công cụ Tìm kiếm/Lọc */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm mã lô, người tạo, ghi chú..." 
                      className="pl-9"
                      value={popupSearchTerm}
                      onChange={e => setPopupSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input type="date" value={popupDateFrom} onChange={e => setPopupDateFrom(e.target.value)} className="w-full sm:w-[130px]" title="Từ ngày" />
                    <span className="text-muted-foreground">-</span>
                    <Input type="date" value={popupDateTo} onChange={e => setPopupDateTo(e.target.value)} className="w-full sm:w-[130px]" title="Đến ngày" />
                  </div>
                </div>
              </div>

              <Tabs value={popupTab} onValueChange={setPopupTab} className="flex-1 flex flex-col min-h-0 px-4 pb-4">
                <TabsList className="grid w-full grid-cols-2 mb-3 shrink-0 h-9">
                  <TabsTrigger value="add">Cấp phát thêm</TabsTrigger>
                  <TabsTrigger value="withdraw">Rút trả kho</TabsTrigger>
                </TabsList>
                
                <TabsContent value="add" className="flex-1 flex flex-col min-h-0 m-0 border rounded-xl overflow-hidden relative">
                  {isFetchingInventory && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10" onScroll={handleScrollPopup}>
                    {!isFetchingInventory && filteredFreeInventory.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Không tìm thấy lô giao dịch nào phù hợp.
                      </div>
                    ) : (
                      visibleFreeInventory.map(fi => (
                        <div key={fi.id_so_cai_vat_tu} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:border-primary/50 transition-all gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                            {fi.danh_sach_anh && fi.danh_sach_anh.length > 0 ? (
                              <img src={fi.danh_sach_anh[0]} className="w-14 h-14 object-cover rounded-lg border shrink-0" alt="img" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground border shrink-0">No img</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-base text-primary truncate">{fi.ma_lo}</p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full whitespace-nowrap"><User className="w-3 h-3"/> {fi.nguoi_tao || 'Hệ thống'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatTime(fi.ngay_tao)}</p>
                              {fi.ghi_chu && <p className="text-sm text-muted-foreground italic line-clamp-1 mt-1" title={fi.ghi_chu}>{fi.ghi_chu}</p>}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs bg-background">
                                  Tổng lô: {fi.bien_dong_so_luong}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-muted">
                                  Đã cấp: {fi.allocated}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2">
                                  Tồn chưa phân: {fi.free}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 bg-muted/30 p-3 rounded-lg border">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Số lượng cấp</span>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max={fi.free}
                                className="w-28 text-center font-bold text-lg text-primary" 
                                placeholder="0"
                                value={allocInputs[fi.id_so_cai_vat_tu] || ""}
                                onChange={e => handleAllocChange(fi.id_so_cai_vat_tu, e.target.value, fi.free)}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 bg-background border-t shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Button className="w-full h-12 text-base font-semibold" onClick={handleSubmitAllocation} disabled={isSubmitting || freeInventory.length === 0}>
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận Cấp phát Vật tư"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="withdraw" className="flex-1 flex flex-col min-h-0 m-0 border rounded-xl overflow-hidden relative">
                  {isFetchingInventory && (
                    <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10" onScroll={handleScrollPopup}>
                    {!isFetchingInventory && filteredAllocatedInventory.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Không tìm thấy lô giao dịch nào phù hợp.
                      </div>
                    ) : (
                      visibleAllocatedInventory.map(al => (
                        <div key={al.id_cap_phat} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:border-destructive/50 transition-all gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                            {al.danh_sach_anh && al.danh_sach_anh.length > 0 ? (
                              <img src={al.danh_sach_anh[0]} className="w-14 h-14 object-cover rounded-lg border shrink-0" alt="img" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground border shrink-0">No img</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-base text-primary truncate">{al.ma_lo}</p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full whitespace-nowrap"><User className="w-3 h-3"/> {al.nguoi_tao || 'Hệ thống'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatTime(al.ngay_tao)}</p>
                              {al.ghi_chu && <p className="text-sm text-muted-foreground italic line-clamp-1 mt-1" title={al.ghi_chu}>{al.ghi_chu}</p>}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs bg-background">
                                  Tổng lô: {al.bien_dong_so_luong}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2">
                                  Đã cấp cho đơn này: {al.so_luong_cap_phat}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                            <span className="text-xs text-destructive font-medium uppercase tracking-wider">Số lượng rút</span>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                min="0" 
                                max={al.so_luong_cap_phat}
                                className="w-28 text-center font-bold text-lg border-destructive/50 focus-visible:ring-destructive text-destructive" 
                                placeholder="0"
                                value={withdrawInputs[al.id_cap_phat] || ""}
                                onChange={e => handleWithdrawChange(al.id_cap_phat, e.target.value, al.so_luong_cap_phat)}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 bg-background border-t shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Button variant="destructive" className="w-full h-12 text-base font-semibold" onClick={handleSubmitWithdrawal} disabled={isSubmitting || allocatedInventory.length === 0}>
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận Rút trả Kho"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
