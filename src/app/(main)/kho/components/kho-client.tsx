"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionPayload } from "@/lib/session"
import { NguyenLieu } from "@/app/actions/kho"
import { DanhMucVatTu } from "./danh-muc-vat-tu"
import { TongQuanKho } from "./tong-quan-kho"
import { PhieuGiaoDich } from "./phieu-giao-dich"
import { DonTongTab } from "./don-tong-tab"
import { Package2, History, ClipboardList, PlusCircle, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useRealtimeSSE } from "@/components/realtime-provider"

export function KhoClient({ 
  session, 
  nguyenLieuList,
  congHangList,
  tongQuanTonKho,
  danhMucList,
  donTongList
}: { 
  session: SessionPayload,
  nguyenLieuList: NguyenLieu[],
  congHangList: any[],
  tongQuanTonKho: any[],
  danhMucList: any[],
  donTongList: any[]
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tong-quan")

  // Đăng ký nhận sự kiện Realtime SSE khi có thay đổi trong kho (đồng bộ ngầm yên lặng)
  useRealtimeSSE({
    tables: ["lo_giao_dich", "so_cai_vat_tu", "nguyen_lieu", "don_tong", "don_tong_chi_tiet"],
    onUpdate: () => {
      router.refresh();
    },
  });

  return (
    <div className="w-full flex-1 flex flex-col relative pb-16">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        {/* THANH CHỌN TAB NẰM TRÊN CÙNG TRANG VỚI HIGHLIGHT TRẠNG THÁI RÕ RÀNG */}
        <TabsList className="flex flex-wrap justify-start !h-auto p-1 bg-muted/30 rounded-full border border-border/60 gap-2 w-fit">
          <TabsTrigger
            value="tong-quan"
            className="gap-2 rounded-full border border-transparent data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/40 text-muted-foreground hover:text-foreground !h-9 px-4 transition-all"
          >
            <Package2 className="h-4 w-4" />
            {t("inventoryTabs.stock")}
          </TabsTrigger>

          {session.role === "Quan ly" && (
            <TabsTrigger
              value="danh-muc"
              className="gap-2 rounded-full border border-transparent data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/40 text-muted-foreground hover:text-foreground !h-9 px-4 transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              {t("inventoryTabs.materials")}
            </TabsTrigger>
          )}

          <TabsTrigger
            value="giao-dich"
            className="gap-2 rounded-full border border-transparent data-[state=active]:!bg-emerald-600 data-[state=active]:!text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-emerald-500/40 text-muted-foreground hover:text-foreground !h-9 px-4 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("warehouse.importExportVoucher")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="don-tong"
            className="gap-2 rounded-full border border-transparent data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-primary/40 text-muted-foreground hover:text-foreground !h-9 px-4 transition-all"
          >
            <ListChecks className="h-4 w-4" />
            Quản lý Đơn tổng
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4 overflow-y-auto pb-8">
          <TabsContent value="tong-quan" className="m-0 h-full">
            <TongQuanKho initialData={tongQuanTonKho} />
          </TabsContent>

          <TabsContent value="giao-dich" className="m-0 h-full">
            <PhieuGiaoDich
              nguyenLieuList={tongQuanTonKho || nguyenLieuList}
              congHangList={congHangList}
              initialDanhMucList={danhMucList}
              donTongList={donTongList}
            />
          </TabsContent>

          <TabsContent value="don-tong" className="m-0 h-full">
            <DonTongTab
              donTongList={donTongList}
              nguyenLieuList={nguyenLieuList}
            />
          </TabsContent>

          {session.role === "Quan ly" && (
            <TabsContent value="danh-muc" className="m-0 h-full">
              <DanhMucVatTu initialData={nguyenLieuList} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* NÚT NỔI (FAB) NHẬP / XUẤT KHO Ở GIỮA CUỐI MÀN HÌNH */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setActiveTab("giao-dich")}
          className={`gap-2 rounded-full px-6 py-6 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20 dark:border-white/10 ${
            activeTab === "giao-dich"
              ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          <PlusCircle className="h-5 w-5 shrink-0" />
          <span className="font-bold text-sm sm:text-base">{t("warehouse.importExport")}</span>
        </Button>
      </div>
    </div>
  );
}
