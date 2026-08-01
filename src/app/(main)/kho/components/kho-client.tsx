"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionPayload } from "@/lib/session"
import { NguyenLieu } from "@/app/actions/kho"
import { DanhMucVatTu } from "./danh-muc-vat-tu"
import { TongQuanKho } from "./tong-quan-kho"
import { PhieuGiaoDich } from "./phieu-giao-dich"
import { Package2, History, ClipboardList, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useRealtimeSSE } from "@/components/realtime-provider"

export function KhoClient({ 
  session, 
  nguyenLieuList,
  congHangList,
  tongQuanTonKho,
  danhMucList
}: { 
  session: SessionPayload,
  nguyenLieuList: NguyenLieu[],
  congHangList: any[],
  tongQuanTonKho: any[],
  danhMucList: any[]
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tong-quan")

  // Đăng ký nhận sự kiện Realtime SSE khi có thay đổi trong kho (đồng bộ ngầm yên lặng)
  useRealtimeSSE({
    tables: ["lo_giao_dich", "so_cai_vat_tu", "nguyen_lieu"],
    onUpdate: () => {
      router.refresh();
    },
  });

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
        <Button 
          onClick={() => setActiveTab("giao-dich")}
          className={`gap-2 shrink-0 ${activeTab === 'giao-dich' ? 'bg-primary' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          <PlusCircle className="h-5 w-5" />
          <span className="font-semibold">Nhập / Xuất Kho</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="flex flex-wrap justify-start !h-auto p-0 bg-transparent gap-2">
          <TabsTrigger 
            value="tong-quan" 
            className="gap-2 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground !h-9 px-4"
          >
            <Package2 className="h-4 w-4" />
            {t('inventoryTabs.stock')}
          </TabsTrigger>

          {session.role === 'Quan ly' && (
            <TabsTrigger 
              value="danh-muc" 
              className="gap-2 rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground !h-9 px-4"
            >
              <ClipboardList className="h-4 w-4" />
              {t('inventoryTabs.materials')}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 mt-4 overflow-y-auto pb-4">
          <TabsContent value="tong-quan" className="m-0 h-full">
            <TongQuanKho initialData={tongQuanTonKho} />
          </TabsContent>



          <TabsContent value="giao-dich" className="m-0 h-full">
            <PhieuGiaoDich nguyenLieuList={tongQuanTonKho || nguyenLieuList} congHangList={congHangList} initialDanhMucList={danhMucList} />
          </TabsContent>

          {session.role === 'Quan ly' && (
            <TabsContent value="danh-muc" className="m-0 h-full">
              <DanhMucVatTu initialData={nguyenLieuList} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}
