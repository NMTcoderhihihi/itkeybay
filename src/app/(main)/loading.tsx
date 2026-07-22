import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1 text-center">
          <h3 className="font-semibold text-lg tracking-tight">Đợi 1 chút, hệ thống đang load</h3>
          <p className="text-sm text-muted-foreground">
            Đang lấy dữ liệu mới nhất từ máy chủ...
          </p>
        </div>
      </div>
    </div>
  );
}
