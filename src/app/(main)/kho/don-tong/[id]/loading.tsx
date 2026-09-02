import { Loader2 } from "lucide-react"

export default function LoadingDonTongDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-lg font-medium text-muted-foreground animate-pulse">
        Đang tải thông tin đơn tổng...
      </p>
    </div>
  )
}
