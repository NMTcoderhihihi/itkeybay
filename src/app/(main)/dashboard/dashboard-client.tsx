"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";
import { useRealtimeSSE } from "@/components/realtime-provider";
import {
  DashboardData,
  getDashboardData,
} from "@/app/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Factory,
  Package,
  Layers,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Boxes,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsChartReady(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Kết nối SSE Realtime toàn cục từ máy chủ
  useRealtimeSSE({
    tables: ["lo_giao_dich", "cong_hang", "nguyen_lieu"],
    onUpdate: (payload) => {
      startTransition(async () => {
        const newData = await getDashboardData();
        setData(newData);

        // Tối ưu UX: Hiệu ứng Highlight khu vực có cập nhật mới
        if (payload.table === "cong_hang") {
          setHighlightSection("cong_hang");
        } else if (payload.table === "lo_giao_dich") {
          setHighlightSection("lo_giao_dich");
        } else {
          setHighlightSection("all");
        }

        // Tự động tắt hiệu ứng highlight sau 4 giây
        setTimeout(() => {
          setHighlightSection(null);
        }, 4000);
      });
    },
  });

  const { kpi, activeCongHangList, statusDistribution, recentTransactions } = data;

  const totalStatusCount = statusDistribution.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* TẦNG 1: 3 THẺ KPI CHIẾN LƯỢC & BIỂU ĐỒ TRẠNG THÁI (TOP ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Nhóm KPI (8 cột trên lg) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {/* Thẻ 1: Tiến độ Xưởng */}
          <Card
            className={`transition-all duration-500 ${
              highlightSection === "cong_hang" || highlightSection === "all"
                ? "ring-2 ring-primary bg-primary/5 shadow-md"
                : "hover:border-primary/40"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {t("dashboard.activeProduction")}
              </CardTitle>
              <Factory className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{kpi.activeCongHangCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {totalStatusCount > 0
                  ? `${Math.round((kpi.activeCongHangCount / totalStatusCount) * 100)} ${t("dashboard.percentTotalOrders")}`
                  : t("dashboard.noOrders")}
              </p>
            </CardContent>
          </Card>

          {/* Thẻ 2: Tồn kho Bán thành phẩm (BTP) */}
          <Card
            className={`transition-all duration-500 ${
              highlightSection === "cong_hang" || highlightSection === "all"
                ? "ring-2 ring-amber-500 bg-amber-500/5 shadow-md"
                : "hover:border-amber-500/40"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {t("dashboard.btpStock")}
              </CardTitle>
              <Package className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                {kpi.tonKhoBtpCount}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {t("dashboard.readyToShip")}
              </p>
            </CardContent>
          </Card>

          {/* Thẻ 3: Hoạt động 24h qua */}
          <Card
            className={`transition-all duration-500 ${
              highlightSection === "lo_giao_dich" || highlightSection === "all"
                ? "ring-2 ring-emerald-500 bg-emerald-500/5 shadow-md"
                : "hover:border-emerald-500/40"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {t("dashboard.transactions24h")}
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {kpi.todayActivityCount}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {t("dashboard.dailyUpdates")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cột Biểu đồ (Chiếm 4/12 cột trên Desktop) */}
        <div className="lg:col-span-4 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="p-3 sm:p-4 border-b">
              <CardTitle className="text-sm sm:text-base font-bold">
                {t("dashboard.statusChartTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 flex-1 flex flex-col items-center justify-center">
              {totalStatusCount === 0 ? (
                <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
                  {t("dashboard.noOrderData")}
                </div>
              ) : !isChartReady ? (
                <div className="w-full h-[120px] sm:h-[140px] flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">
                  <span className="text-xs text-muted-foreground font-medium">{t("dashboard.renderingChart")}</span>
                </div>
              ) : (
                <div className="w-full h-[120px] sm:h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="40%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value} ${t("dashboard.ordersCount")}`, t("dashboard.quantity")]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        layout="vertical"
                        align="right"
                        wrapperStyle={{ fontSize: "11px" }}
                        formatter={(value: string, entry: any) => {
                          const code = entry.payload?.code || "";
                          const label =
                            code === "DANG_LAM"
                              ? t("dashboard.statusDangLam")
                              : code === "TON_KHO"
                              ? t("dashboard.statusTonKho")
                              : code === "DA_GIAO"
                              ? t("dashboard.statusDaGiao")
                              : code === "CHUA_LAM"
                              ? t("dashboard.statusChuaLam")
                              : value;
                          return (
                            <span className="text-[11px] font-medium text-foreground ml-1">
                              {label} ({entry.payload.value})
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TẦNG 2: BẢNG TIẾN ĐỘ CÔNG HÀNG (100% WIDTH) */}
      <Card
        className={`w-full transition-all duration-500 ${
          highlightSection === "cong_hang" ? "ring-2 ring-primary/60 shadow-lg" : ""
        }`}
      >
        <CardHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-1.5">
              <Factory className="h-4 w-4 text-primary" />
              {t("dashboard.activeOrdersTitle")}
            </CardTitle>
          </div>
          <Link href="/san-xuat">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
              {t("dashboard.viewAll")}
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bảng dọc tiết kiệm diện tích, cho phép cuộn ngang (overflow-x-auto) trên Mobile */}
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.orderCode")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold min-w-[120px]">
                    {t("dashboard.productOrder")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold min-w-[140px]">
                    {t("dashboard.stageProgress")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.inProgress")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCongHangList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-muted-foreground text-xs">
                      {t("dashboard.noActiveOrders")}
                    </TableCell>
                  </TableRow>
                ) : (
                  activeCongHangList.map((ch) => (
                    <TableRow
                      key={ch.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                        <Link href={`/san-xuat/${ch.id}`} className="text-primary hover:underline hover:text-primary/80 transition-colors" title={t("dashboard.viewAll")}>
                          {ch.ma_cong_hang}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs">
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {ch.danh_sach_don_hang && ch.danh_sach_don_hang.length > 0 ? (
                            ch.danh_sach_don_hang.map((dh, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 text-xs border-b border-border/40 last:border-0 pb-1 last:pb-0"
                              >
                                <span className="font-semibold text-foreground truncate" title={dh.ma_hang}>
                                  {dh.ma_hang}
                                </span>
                                {dh.so_luong_san_xuat !== undefined && (
                                  <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    x{dh.so_luong_san_xuat}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="font-medium text-foreground whitespace-normal break-words text-xs leading-relaxed">
                              {ch.ten_san_pham}
                            </div>
                          )}
                        </div>
                        {ch.ghi_chu && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[150px] sm:max-w-[200px] mt-1">
                            {ch.ghi_chu}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span>{ch.progress}%</span>
                            <span className="text-muted-foreground">
                              {ch.completedStages}/{ch.totalStages}
                            </span>
                          </div>
                          <Progress value={ch.progress} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {ch.currentStageName}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TẦNG 3: DANH SÁCH 10 HÀNH ĐỘNG GIAO DỊCH GẦN NHẤT (100% WIDTH) */}
      <Card
        className={`transition-all duration-500 ${
          highlightSection === "lo_giao_dich" ? "ring-2 ring-emerald-500/60 shadow-lg" : ""
        }`}
      >
        <CardHeader className="p-3 sm:p-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-500" />
              {t("dashboard.recentTxTitle")}
            </CardTitle>
          </div>
          <Link href="/kho?tab=ledger">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
              {t("dashboard.viewLedger")}
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {/* Bảng có thanh cuộn ngang (overflow-x-auto) tối ưu cho thiết bị di động */}
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.time")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.performer")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.txAction")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold min-w-[150px]">
                    {t("dashboard.objectType")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.quantity")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold whitespace-nowrap">
                    {t("dashboard.totalOrders")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold min-w-[140px]">
                    {t("dashboard.note")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold text-center whitespace-nowrap">
                    {t("dashboard.proof")}
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-xs font-bold text-right whitespace-nowrap">
                    {t("dashboard.batchOrderCode")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-28 text-center text-muted-foreground text-xs">
                      {t("dashboard.noTransactions")}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap text-muted-foreground font-mono">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {tx.ho_ten_nhan_vien}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            tx.loai_giao_dich === "NHAP"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : tx.loai_giao_dich === "XUAT"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {tx.ten_danh_muc}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              tx.loai_doi_tuong === "BAN_THANH_PHAM"
                                ? "bg-purple-500/10 text-purple-600 dark:purple-400 border border-purple-500/20"
                                : "bg-teal-500/10 text-teal-600 dark:teal-400 border border-teal-500/20"
                            }`}
                          >
                            {tx.loai_doi_tuong === "BAN_THANH_PHAM" ? t("dashboard.semiProduct") : t("dashboard.rawMaterial")}
                          </span>
                          <span
                            className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]"
                            title={tx.doi_tuong_ten}
                          >
                            {tx.doi_tuong_ten}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap">
                        {tx.loai_doi_tuong === "BAN_THANH_PHAM" ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1 min-w-[140px]">
                            {tx.danh_sach_don_hang && tx.danh_sach_don_hang.length > 0 ? (
                              tx.danh_sach_don_hang.map((dh, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 text-xs border-b border-border/40 last:border-0 pb-0.5 last:pb-0"
                                >
                                  <span className="font-semibold text-foreground truncate" title={dh.ma_hang}>
                                    {dh.ma_hang}
                                  </span>
                                  {dh.so_luong_san_xuat !== undefined && (
                                    <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      x{dh.so_luong_san_xuat}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground font-medium">
                                {tx.so_luong_tong > 0 ? `${tx.so_luong_tong} SL` : "-"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">
                              {tx.so_luong_tong > 0 ? `+${tx.so_luong_tong}` : (tx.so_luong_tong || 0)} SL
                            </span>
                            {tx.quy_cach_ghi_chu && (
                              <span
                                className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]"
                                title={tx.quy_cach_ghi_chu}
                              >
                                {tx.quy_cach_ghi_chu}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs whitespace-nowrap">
                        {tx.ma_cong_hang ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                            {tx.ma_cong_hang}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs text-muted-foreground">
                        <div className="truncate max-w-[140px] sm:max-w-[200px]" title={tx.ghi_chu}>
                          {tx.ghi_chu || t("dashboard.noNote")}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs text-center">
                        {tx.danh_sach_anh && tx.danh_sach_anh.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap max-w-[90px]">
                            {tx.danh_sach_anh.map((url: string, i: number) => (
                              <div
                                key={i}
                                className="relative w-7 h-7 border rounded overflow-hidden cursor-pointer hover:scale-110 hover:border-primary transition-all shadow-sm"
                                onClick={() => setPreviewImage(url)}
                                title="Nhấp để xem ảnh minh chứng"
                              >
                                <Image
                                  src={url}
                                  alt="Minh chứng"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground opacity-40">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs font-bold text-right whitespace-nowrap">
                        <span className="font-mono text-primary">{tx.ma_lo}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL XEM ẢNH MINH CHỨNG */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-none flex flex-col items-center justify-center">
          <DialogTitle className="text-white text-sm font-semibold mb-2 text-center">
            Ảnh minh chứng giao dịch
          </DialogTitle>
          {previewImage && (
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <Image
                src={previewImage}
                alt="Minh chứng giao dịch"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
