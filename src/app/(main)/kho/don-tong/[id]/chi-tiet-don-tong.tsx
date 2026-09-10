"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { ArrowLeft, Clock, Package, FileText, User, Search, Plus } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getFreeInventoryForMaterial, allocateFreeInventory } from "@/app/actions/don-tong"

export function ChiTietDonTongClient({ donTong, giaoDichList }: { donTong: any, giaoDichList: any[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  // Popup State
  const [allocatingMaterial, setAllocatingMaterial] = useState<any>(null)
  const [freeInventory, setFreeInventory] = useState<any[]>([])
  const [allocInputs, setAllocInputs] = useState<Record<string, string>>({})
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setFreeInventory([])
    setAllocInputs({})
    const inventory = await getFreeInventoryForMaterial(ct.id_nguyen_lieu, ct.ma_quy_cach)
    setFreeInventory(inventory)
  }

  const handleAllocChange = (id_so_cai_vat_tu: string, value: string, maxFree: number) => {
    const numValue = Number(value)
    if (numValue < 0) return
    if (numValue > maxFree) return // block exceeding free
    setAllocInputs(prev => ({ ...prev, [id_so_cai_vat_tu]: value }))
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
      alert("Vui lòng nhập số lượng muốn cấp phát.")
      return
    }
    if (totalAllocating > missing) {
      alert(`Bạn đang cấp dư. Đơn chỉ còn thiếu ${missing}.`)
      return
    }

    setIsSubmitting(true)
    const res = await allocateFreeInventory(allocatingMaterial.id, allocations, donTong.id)
    setIsSubmitting(false)

    if (res.success) {
      setIsPopupOpen(false)
      alert("Cấp phát thành công!")
      router.refresh()
    } else {
      alert("Lỗi: " + res.error)
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

      {/* THÔNG TIN CHUNG (TOP) */}
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

      {/* CHI TIẾT TIẾN ĐỘ */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("masterOrder.detailsProgress")}
          </CardTitle>
          <div className="relative w-full md:w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên / quy cách..."
              className="w-full pl-9 bg-muted/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-6 pt-0 space-y-4">
            {filteredDetails?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Không tìm thấy vật tư.</div>
            ) : (
              filteredDetails?.map((ct: any) => {
                const nl = ct.nguyen_lieu;
                const y = Number(ct.so_luong_yeu_cau);
                const d = Number(ct.so_luong_da_nhap);
                const pct = y > 0 ? Math.min(100, Math.round((d / y) * 100)) : 0;

                const quyCachObj = nl?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === ct.ma_quy_cach);
                const quyCachName = quyCachObj ? quyCachObj.ten : ct.ma_quy_cach;

                return (
                  <div key={ct.id} className="bg-muted/10 p-4 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {nl?.anh_minh_hoa ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={nl.anh_minh_hoa} alt="" className="w-12 h-12 rounded-full object-cover border shadow-sm shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {nl?.ten_nguyen_lieu?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold truncate">{nl?.ten_nguyen_lieu}</span>
                        <span className="text-sm text-muted-foreground truncate">{quyCachName}</span>
                        <div className="text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>{t("masterOrder.imported")} <span className="font-semibold text-foreground">{d}</span> / {y} {nl?.don_vi}</span>
                          {d < y && <Badge variant="destructive" className="text-[10px]">Thiếu: {y - d}</Badge>}
                          {d === y && <Badge className="bg-green-600 hover:bg-green-600 text-[10px]">Đủ</Badge>}
                          {d > y && <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px]">Dư: {d - y}</Badge>}
                        </div>

                        {/* Liệt kê nguồn gốc cấp phát */}
                        {ct.chi_tiet_cap_phat && ct.chi_tiet_cap_phat.length > 0 && (
                          <div className="mt-2 space-y-1 bg-background/50 p-2 rounded border">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase">Nguồn cấp phát:</p>
                            <div className="flex flex-wrap gap-2">
                              {ct.chi_tiet_cap_phat.map((cp: any) => (
                                <div key={cp.id} className="text-xs flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                                  <span className="font-medium text-primary">{cp.so_cai_vat_tu?.lo_giao_dich?.ma_lo || "Không rõ"}</span>
                                  <span className="text-muted-foreground">({format(new Date(cp.so_cai_vat_tu?.lo_giao_dich?.ngay_tao), "dd/MM")})</span>
                                  <span className="font-bold text-emerald-600">+{cp.so_luong_cap_phat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                      {d < y && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenPopup(ct)}>
                          <Plus className="w-4 h-4 mr-1" /> Điều phối
                        </Button>
                      )}
                      <CircularProgressRing progress={pct} size={56} strokeWidth={4} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* LỊCH SỬ GIAO DỊCH */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Lịch sử giao dịch liên quan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-6 pt-0">
            {giaoDichList.length === 0 ? (
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
                  {giaoDichList.map(gd => (
                    <TableRow key={gd.id} className="align-top">
                      <TableCell>
                        {gd.danh_sach_anh && gd.danh_sach_anh.length > 0 ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={gd.danh_sach_anh[0]} className="w-12 h-12 object-cover rounded-md border shadow-sm" alt="gd" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground border">No image</div>
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
                        <div className="space-y-1.5 bg-muted/10 p-2 rounded-md border min-w-[300px]">
                          {gd.so_cai_vat_tu?.length > 0 ? (
                            gd.so_cai_vat_tu.map((sc: any, idx: number) => {
                              const qcArray = Array.isArray(sc.nguyen_lieu?.danh_sach_quy_cach) ? sc.nguyen_lieu.danh_sach_quy_cach : [];
                              const qcObj = qcArray.find((q: any) => q.ma_quy_cach === sc.ma_quy_cach);
                              const sl = Math.abs(Number(sc.bien_dong_so_luong) || 0);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-3 text-sm py-1 border-b border-border/40 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-medium text-foreground truncate">{sc.nguyen_lieu?.ten_nguyen_lieu}</span>
                                    {qcObj?.ten && <span className="text-[11px] text-muted-foreground bg-background border px-1.5 py-0.5 rounded truncate">{qcObj.ten}</span>}
                                  </div>
                                  <div className="font-semibold tabular-nums shrink-0">
                                    {sl} <span className="text-muted-foreground text-xs font-normal">{sc.nguyen_lieu?.don_vi}</span>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Không có vật tư</span>
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

      {/* POPUP ĐIỀU PHỐI VẬT TƯ */}
      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              Điều phối vật tư từ Tồn chưa phân
              {allocatingMaterial && (
                <span className="text-sm font-normal text-muted-foreground">
                  Đang thiếu: <strong className="text-destructive">{Number(allocatingMaterial.so_luong_yeu_cau) - Number(allocatingMaterial.so_luong_da_nhap)}</strong> {allocatingMaterial.nguyen_lieu?.don_vi}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {freeInventory === null || freeInventory.length === 0 ? (
              <div className="text-center p-6 bg-muted/20 rounded-lg text-muted-foreground text-sm border">
                Không có giao dịch nào đang dư vật tư này. Vui lòng nhập thêm hàng vào kho.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                {freeInventory.map(item => (
                  <div key={item.id_so_cai_vat_tu} className="flex items-center justify-between p-3 border rounded-md bg-muted/10">
                    <div>
                      <div className="font-semibold text-primary">{item.ma_lo}</div>
                      <div className="text-xs text-muted-foreground mb-1">{formatTime(item.ngay_tao)}</div>
                      <div className="text-sm">
                        Tổng nhập: {item.bien_dong_so_luong} | Đã cấp: {item.allocated}
                      </div>
                      <div className="text-sm mt-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Tồn chưa phân: {item.free}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Input 
                        type="number" 
                        min="0" 
                        max={item.free}
                        placeholder="Số lượng..."
                        value={allocInputs[item.id_so_cai_vat_tu] || ""}
                        onChange={(e) => handleAllocChange(item.id_so_cai_vat_tu, e.target.value, item.free)}
                        className="w-24 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPopupOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitAllocation} disabled={isSubmitting || freeInventory.length === 0}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận cấp phát"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
