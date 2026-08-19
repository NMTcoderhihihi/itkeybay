import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">Đang tải thông tin chi tiết công hàng...</p>
    </div>
  )
}