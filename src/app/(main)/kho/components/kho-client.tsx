"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionPayload } from "@/lib/session"
import { NguyenLieu } from "@/app/actions/kho"
import { DanhMucVatTu } from "./danh-muc-vat-tu"
import { TongQuanKho } from "./tong-quan-kho"
import { PhieuGiaoDich } from "./phieu-giao-dich"
import { Package2, History, ClipboardList } from "lucide-react"

export function KhoClient({ 
  session, 
  nguyenLieuList 
}: { 
  session: SessionPayload,
  nguyenLieuList: NguyenLieu[]
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("tong-quan")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
      <TabsList className="w-full justify-start overflow-x-auto h-auto py-1">
        <TabsTrigger value="tong-quan" className="gap-2">
          <Package2 className="h-4 w-4" />
          {t('inventoryTabs.stock')}
        </TabsTrigger>
        <TabsTrigger value="giao-dich" className="gap-2">
          <History className="h-4 w-4" />
          {t('inventoryTabs.transactions')}
        </TabsTrigger>
        {session.role === 'Quan ly' && (
          <TabsTrigger value="danh-muc" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('inventoryTabs.materials')}
          </TabsTrigger>
        )}
      </TabsList>

      <div className="flex-1 mt-4 overflow-y-auto pb-4">
        <TabsContent value="tong-quan" className="m-0 h-full">
          <TongQuanKho />
        </TabsContent>

        <TabsContent value="giao-dich" className="m-0 h-full">
          <PhieuGiaoDich nguyenLieuList={nguyenLieuList} />
        </TabsContent>

        {session.role === 'Quan ly' && (
          <TabsContent value="danh-muc" className="m-0 h-full">
            <DanhMucVatTu initialData={nguyenLieuList} />
          </TabsContent>
        )}
      </div>
    </Tabs>
  )
}
