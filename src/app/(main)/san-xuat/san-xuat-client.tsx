"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CongDoanManager } from "./cong-doan-manager"
import { CongHangForm } from "./cong-hang-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Factory, Package, ListTodo, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

type CongHang = {
  id: string
  ma_cong_hang: string
  trang_thai_sx: 'CHUA_LAM' | 'DANG_LAM' | 'DA_LAM'
  danh_sach_cong_doan: any[]
  ngay_tao: string
  don_hang: any[]
}

type CongDoan = {
  id: string
  ten_cong_doan: string
  ghi_chu: string
}

export function SanXuatClient({ 
  congHangList, 
  congDoanList 
}: { 
  congHangList: CongHang[]
  congDoanList: CongDoan[]
}) {
  const [activeTab, setActiveTab] = useState("cong-hang")

  const chuaLam = congHangList.filter(c => c.trang_thai_sx === 'CHUA_LAM')
  const dangLam = congHangList.filter(c => c.trang_thai_sx === 'DANG_LAM')
  const daLam = congHangList.filter(c => c.trang_thai_sx === 'DA_LAM')

  const CongHangCard = ({ ch }: { ch: CongHang }) => {
    const totalSteps = ch.danh_sach_cong_doan.length
    const completedSteps = ch.danh_sach_cong_doan.filter(cd => cd.da_xong).length
    const progress = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)

    const totalProducts = ch.don_hang.reduce((acc, curr) => acc + curr.so_luong_san_xuat, 0)

    return (
      <Link href={`/san-xuat/${ch.id}`}>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden group">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="truncate" title={ch.ma_cong_hang}>{ch.ma_cong_hang}</span>
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              Tạo lúc: {format(new Date(ch.ngay_tao), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Package className="h-4 w-4 mr-2" />
                <span>{ch.don_hang.length} Đơn hàng ({totalProducts} SP)</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Tiến độ công đoạn</span>
                  <span className="font-medium">{completedSteps}/{totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Sản xuất</h1>
        {activeTab === "cong-hang" && (
          <CongHangForm congDoanList={congDoanList} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="cong-hang">Tiến độ Công hàng</TabsTrigger>
          <TabsTrigger value="cong-doan">Danh mục Công đoạn</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cong-hang" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cột 1: Chưa làm */}
            <div className="bg-muted/30 rounded-xl p-4 border flex flex-col h-full min-h-[500px]">
              <div className="flex items-center gap-2 mb-4 font-semibold text-muted-foreground">
                <ListTodo className="h-5 w-5" />
                <h2>Chưa sản xuất ({chuaLam.length})</h2>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {chuaLam.map(ch => <CongHangCard key={ch.id} ch={ch} />)}
                {chuaLam.length === 0 && (
                  <div className="m-auto text-sm text-muted-foreground">Trống</div>
                )}
              </div>
            </div>

            {/* Cột 2: Đang làm */}
            <div className="bg-primary/5 border-primary/20 rounded-xl p-4 border flex flex-col h-full min-h-[500px]">
              <div className="flex items-center gap-2 mb-4 font-semibold text-primary">
                <Factory className="h-5 w-5" />
                <h2>Đang sản xuất ({dangLam.length})</h2>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {dangLam.map(ch => <CongHangCard key={ch.id} ch={ch} />)}
                {dangLam.length === 0 && (
                  <div className="m-auto text-sm text-muted-foreground">Trống</div>
                )}
              </div>
            </div>

            {/* Cột 3: Đã làm */}
            <div className="bg-green-500/5 border-green-500/20 rounded-xl p-4 border flex flex-col h-full min-h-[500px]">
              <div className="flex items-center gap-2 mb-4 font-semibold text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <h2>Đã hoàn thành ({daLam.length})</h2>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {daLam.map(ch => <CongHangCard key={ch.id} ch={ch} />)}
                {daLam.length === 0 && (
                  <div className="m-auto text-sm text-muted-foreground">Trống</div>
                )}
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="cong-doan" className="mt-6">
          <CongDoanManager initialData={congDoanList} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
