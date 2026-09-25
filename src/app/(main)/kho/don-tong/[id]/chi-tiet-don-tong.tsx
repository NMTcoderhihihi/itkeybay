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
          <div className="h-[400px] overflow-y-auto p-6 pt-0 space-y-4">
            {filteredDetails?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Không tìm thấy vật tư nào phù hợp.</div>
            ) : (
              filteredDetails?.map((ct: any) => {
                const y = Number(ct.so_luong_yeu_cau)
                const d = Number(ct.so_luong_da_nhap)
                const pct = y > 0 ? Math.min(100, Math.round((d / y) * 100)) : 0
                
                const quyCachObj = ct.nguyen_lieu?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === ct.ma_quy_cach)
                
                return (
                  <div key={ct.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors shadow-sm">
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{ct.nguyen_lieu?.ten_nguyen_lieu}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {quyCachObj?.ten && (
                              <Badge variant="outline" className="bg-background text-xs font-normal">
                                Quy cách: {quyCachObj.ten}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="bg-muted text-xs font-normal">
                              Mã: {ct.ma_quy_cach}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-1">
                        <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-4">
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
                          <div className="text-sm bg-destructive/10 text-destructive px-3 py-1.5 rounded-md font-medium border border-destructive/20 inline-flex items-center w-fit">
                            Đang thiếu: {y - d} {ct.nguyen_lieu?.don_vi}
                          </div>
                        ) : (
                          <div className="text-sm bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md font-medium border border-emerald-500/20 inline-flex items-center w-fit">
                            Đã nhận đủ hàng
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleOpenPopup(ct)}>
                        <SlidersHorizontal className="w-4 h-4 mr-1" /> Điều chỉnh
                      </Button>
                      <CircularProgressRing progress={pct} size={56} strokeWidth={4} />
                    </div>
                  </div>
                )
              })
            )}
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Điều chỉnh vật tư Đơn Tổng</DialogTitle>
          </DialogHeader>
          
          {allocatingMaterial && (
            <div className="py-2">
              <div className="flex items-center justify-between mb-4 bg-muted p-3 rounded-md border">
                <div>
                  <h4 className="font-semibold">{allocatingMaterial.nguyen_lieu?.ten_nguyen_lieu}</h4>
                  <p className="text-sm text-muted-foreground">Mã: {allocatingMaterial.ma_quy_cach}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Tiến độ: <span className="font-bold text-primary">{allocatingMaterial.so_luong_da_nhap}</span> / {allocatingMaterial.so_luong_yeu_cau}</p>
                  {Number(allocatingMaterial.so_luong_da_nhap) < Number(allocatingMaterial.so_luong_yeu_cau) && (
                    <p className="text-sm font-semibold text-destructive mt-0.5">
                      Đang thiếu: {Number(allocatingMaterial.so_luong_yeu_cau) - Number(allocatingMaterial.so_luong_da_nhap)}
                    </p>
                  )}
                </div>
              </div>

              <Tabs value={popupTab} onValueChange={setPopupTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="add">Cấp phát thêm</TabsTrigger>
                  <TabsTrigger value="withdraw">Rút trả kho</TabsTrigger>
                </TabsList>
                
                <TabsContent value="add" className="space-y-4">
                  {freeInventory.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border rounded-md bg-muted/30">
                      Kho không còn giao dịch nào dư vật tư này.
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                      {freeInventory.map(fi => (
                        <div key={fi.id_so_cai_vat_tu} className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm hover:border-primary/50 transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-primary">{fi.ma_lo}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(fi.ngay_tao)}</p>
                            <Badge variant="outline" className="mt-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                              Tồn chưa phân: {fi.free}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Cấp:</span>
                            <Input 
                              type="number" 
                              min="0" 
                              max={fi.free}
                              className="w-24 text-center font-semibold" 
                              placeholder="0"
                              value={allocInputs[fi.id_so_cai_vat_tu] || ""}
                              onChange={e => handleAllocChange(fi.id_so_cai_vat_tu, e.target.value, fi.free)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button className="w-full mt-2" onClick={handleSubmitAllocation} disabled={isSubmitting || freeInventory.length === 0}>
                    Xác nhận Cấp phát
                  </Button>
                </TabsContent>
                
                <TabsContent value="withdraw" className="space-y-4">
                  {allocatedInventory.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border rounded-md bg-muted/30">
                      Chưa có lô nào cấp phát vật tư này cho đơn tổng.
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                      {allocatedInventory.map(al => (
                        <div key={al.id_cap_phat} className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm hover:border-destructive/50 transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-primary">{al.ma_lo}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(al.ngay_tao)}</p>
                            <Badge variant="outline" className="mt-1.5 bg-amber-50 text-amber-700 border-amber-200">
                              Đã cấp: {al.so_luong_cap_phat}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rút ra:</span>
                            <Input 
                              type="number" 
                              min="0" 
                              max={al.so_luong_cap_phat}
                              className="w-24 text-center font-semibold border-destructive/50 focus-visible:ring-destructive" 
                              placeholder="0"
                              value={withdrawInputs[al.id_cap_phat] || ""}
                              onChange={e => handleWithdrawChange(al.id_cap_phat, e.target.value, al.so_luong_cap_phat)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="destructive" className="w-full mt-2" onClick={handleSubmitWithdrawal} disabled={isSubmitting || allocatedInventory.length === 0}>
                    Xác nhận Rút trả
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
