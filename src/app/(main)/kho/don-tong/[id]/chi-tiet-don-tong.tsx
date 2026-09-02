"use client"

import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircularProgressRing } from "@/components/ui/circular-progress-ring"
import { ArrowLeft, Clock, Package, FileText, User } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export function ChiTietDonTongClient({ donTong, giaoDichList }: { donTong: any, giaoDichList: any[] }) {
  const { t } = useTranslation()
  const router = useRouter()

  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), "HH:mm - dd/MM/yyyy", { locale: vi })
    } catch {
      return ts
    }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {t("masterOrder.detailsProgress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donTong.don_tong_chi_tiet?.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">{t("masterOrder.noDetails")}</div>
                ) : (
                  donTong.don_tong_chi_tiet?.map((ct: any) => {
                    const nl = ct.nguyen_lieu;
                    const y = Number(ct.so_luong_yeu_cau);
                    const d = Number(ct.so_luong_da_nhap);
                    const pct = y > 0 ? Math.min(100, Math.round((d / y) * 100)) : 0;

                    return (
                      <div key={ct.id_nguyen_lieu + ct.ma_quy_cach} className="bg-muted/20 p-4 rounded-lg border flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {nl?.anh_minh_hoa ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={nl.anh_minh_hoa} alt="" className="w-12 h-12 rounded-full object-cover border shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {nl?.ten_nguyen_lieu?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold">{nl?.ten_nguyen_lieu}</span>
                            <span className="text-sm text-muted-foreground">QC: {ct.ma_quy_cach}</span>
                            <span className="text-sm mt-1">
                              {t("masterOrder.imported")} <span className="font-semibold text-foreground">{d}</span> / {y} {nl?.don_vi}
                            </span>
                          </div>
                        </div>
                        
                        <CircularProgressRing progress={pct} size={56} strokeWidth={4} />
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Thông tin chung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <div className="bg-muted/40 p-3 rounded-md text-sm">
                    {donTong.ghi_chu}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Lịch sử giao dịch liên quan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {giaoDichList.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Chưa có giao dịch nào liên kết với đơn tổng này.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giaoDichList.map(gd => (
                  <TableRow key={gd.id}>
                    <TableCell className="font-medium">{gd.ma_lo}</TableCell>
                    <TableCell>
                      <Badge variant={gd.danh_muc_giao_dich?.loai_giao_dich === 'NHAP' ? 'default' : 'secondary'}>
                        {gd.danh_muc_giao_dich?.ten_danh_muc}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTime(gd.ngay_tao)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {gd.tai_khoan?.ho_ten}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {gd.ghi_chu || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
