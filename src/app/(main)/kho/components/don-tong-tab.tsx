import { useTranslation } from "@/hooks/use-translation"
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, ChevronDown, ChevronUp, Edit2, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { FormDonTong } from "./form-don-tong"
import { Progress } from "@/components/ui/progress"
import { xoaDonTong } from "@/app/actions/don-tong"
import { toast } from "sonner"

export function DonTongTab({ donTongList = [], nguyenLieuList = [] }: { donTongList: any[], nguyenLieuList: any[] }) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL") // "ALL", "TODAY", "WEEK", "MONTH"
  
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingData, setEditingData] = useState<any | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("masterOrder.deleteConfirm"))) {
      const res = await xoaDonTong(id)
      if (res.success) toast.success(t("masterOrder.deletedSuccess"))
      else toast.error(res.error || t("masterOrder.deleteError"))
    }
  }

  const handleEdit = (dt: any) => {
    setEditingData(dt)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingData(null)
    setFormOpen(true)
  }

  const now = new Date()
  const filteredList = donTongList.filter(dt => {
    // Search
    const matchSearch = (dt.ma_don_tong?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                        (dt.ten_don?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status Filter
    const matchStatus = statusFilter === "ALL" || dt.trang_thai === statusFilter;

    // Date filter
    let matchDate = true
    if (dateFilter !== "ALL") {
      const dtDate = new Date(dt.ngay_tao)
      if (dateFilter === "TODAY") {
        matchDate = dtDate.toDateString() === now.toDateString()
      } else if (dateFilter === "WEEK") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchDate = dtDate >= weekAgo
      } else if (dateFilter === "MONTH") {
        matchDate = dtDate.getMonth() === now.getMonth() && dtDate.getFullYear() === now.getFullYear()
      }
    }

    return matchSearch && matchStatus && matchDate
  })

  return (
    <div className="space-y-4">
      {/* Thanh công cụ */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("masterOrder.searchPlaceholder")} 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder={t("masterOrder.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("masterOrder.allStatus")}</SelectItem>
              <SelectItem value="CHUA_DU">{t("masterOrder.statusNotEnough")}</SelectItem>
              <SelectItem value="DA_DU">{t("masterOrder.statusEnough")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder={t("masterOrder.time")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("masterOrder.allTime")}</SelectItem>
              <SelectItem value="TODAY">{t("masterOrder.today")}</SelectItem>
              <SelectItem value="WEEK">{t("masterOrder.last7Days")}</SelectItem>
              <SelectItem value="MONTH">{t("masterOrder.thisMonth")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto shrink-0 gap-2">
          <Plus className="w-4 h-4" /> Thêm đơn mới
        </Button>
      </div>

      {/* Danh sách */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>{t("masterOrder.orderCode")}</TableHead>
                <TableHead>{t("masterOrder.nameNote")}</TableHead>
                <TableHead>{t("masterOrder.totalProgress")}</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>{t("masterOrder.createdAt")}</TableHead>
                <TableHead className="text-right">{t("masterOrder.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy đơn tổng nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((dt) => {
                  const isExpanded = expandedIds.includes(dt.id)
                  const totalNeed = dt.don_tong_chi_tiet?.reduce((sum: number, ct: any) => sum + Number(ct.so_luong_yeu_cau), 0) || 0
                  const totalDone = dt.don_tong_chi_tiet?.reduce((sum: number, ct: any) => sum + Number(ct.so_luong_da_nhap), 0) || 0
                  const progressPct = totalNeed > 0 ? Math.min(100, Math.round((totalDone / totalNeed) * 100)) : 0

                  return (
                    <React.Fragment key={dt.id}>
                      <TableRow className="hover:bg-muted/30 cursor-pointer group" onClick={() => toggleExpand(dt.id)}>
                        <TableCell>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="font-semibold">{dt.ma_don_tong}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{dt.ten_don || '-'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{dt.ghi_chu}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progressPct} className="h-2 w-[80px]" />
                            <span className="text-xs text-muted-foreground font-medium">{progressPct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dt.trang_thai === 'DA_DU' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">{t("masterOrder.statusEnough")}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5">{t("masterOrder.statusNotEnough")}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(dt.ngay_tao), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(dt)} className="h-8 w-8 text-primary hover:bg-primary/10">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dt.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="bg-muted/10">
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 pl-12 border-l-2 border-l-primary/50 mx-2 my-2 bg-background rounded-r-lg shadow-sm">
                              <h4 className="text-sm font-semibold mb-3">{t("masterOrder.detailsProgress")}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dt.don_tong_chi_tiet?.length === 0 ? (
                                  <div className="text-sm text-muted-foreground">{t("masterOrder.noDetails")}</div>
                                ) : (
                                  dt.don_tong_chi_tiet?.map((ct: any) => {
                                    const nl = ct.nguyen_lieu;
                                    const y = Number(ct.so_luong_yeu_cau);
                                    const d = Number(ct.so_luong_da_nhap);
                                    const pct = y > 0 ? Math.min(100, Math.round((d / y) * 100)) : 0;
                                    const quyCachName = "QC: " + ct.ma_quy_cach; // Bạn có thể map tên từ nguyenLieuList nếu cần

                                    return (
                                      <div key={ct.id} className="bg-muted/30 p-3 rounded-md border flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          {nl?.anh_minh_hoa ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={nl.anh_minh_hoa} alt="" className="w-6 h-6 rounded-full object-cover border shadow-sm" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                              {nl?.ten_nguyen_lieu?.charAt(0) || '?'}
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-sm font-semibold truncate max-w-[150px]">{nl?.ten_nguyen_lieu}</span>
                                            <span className="text-[10px] text-muted-foreground">{quyCachName}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                          <div className="flex justify-between text-[11px]">
                                            <span className="text-muted-foreground">{t("masterOrder.imported")} <span className="font-semibold text-foreground">{d}</span> / {y} {nl?.don_vi}</span>
                                            <span className={pct === 100 ? 'text-emerald-600 font-bold' : 'font-medium'}>{pct}%</span>
                                          </div>
                                          <Progress value={pct} className={`h-1.5 ${pct === 100 ? '[&>div]:bg-emerald-500' : ''}`} />
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <FormDonTong 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        nguyenLieuList={nguyenLieuList} 
        initialData={editingData} 
      />
    </div>
  )
}

import React from 'react'
