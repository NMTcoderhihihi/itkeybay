"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useRealtimeStatus } from "@/components/realtime-provider";

export function SSEStatusIcon() {
  const { t } = useTranslation();
  const status = useRealtimeStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const isConnected = status === "CONNECTED";
  const isConnecting = status === "CONNECTING";
  const isDisconnected = status === "DISCONNECTED";

  const colorBorderClass = isConnected
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
    : isConnecting
    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
    : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20";

  const dotColorClass = isConnected
    ? "bg-emerald-500"
    : isConnecting
    ? "bg-amber-500"
    : "bg-red-500";

  const pingColorClass = isConnected
    ? "bg-emerald-400"
    : isConnecting
    ? "bg-amber-400"
    : "bg-red-400";

  const statusTitle = isConnected
    ? (t("sse.status_title") || "Realtime: Đang kết nối")
    : isConnecting
    ? "Realtime: Đang kết nối..."
    : "Realtime: Mất kết nối (Đang thử lại)";

  const statusDesc = isConnected
    ? (t("sse.status_desc") || "Hệ thống đang tự động lắng nghe thay đổi và cập nhật dữ liệu tức thì qua kết nối WebSocket trực tiếp.")
    : isConnecting
    ? "Đang khởi tạo luồng dữ liệu thời gian thực tới máy chủ Supabase..."
    : "Kết nối thời gian thực bị ngắt. Hệ thống sẽ tiếp tục thử kết nối lại tự động.";

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div 
        className={`flex items-center justify-center h-9 w-9 rounded-full border cursor-pointer transition-all shadow-sm ${colorBorderClass}`}
        title={statusTitle}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColorClass}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColorClass}`}></span>
          </span>
          <Activity className="h-4 w-4" />
        </div>
      </div>

      {showTooltip && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${dotColorClass}`} />
            <span>{statusTitle}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {statusDesc}
          </p>
        </div>
      )}
    </div>
  );
}
