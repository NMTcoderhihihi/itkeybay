"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useRealtimeSync } from "@/components/realtime-provider";

export function SSEStatusIcon() {
  const { t } = useTranslation();
  const { lastSyncedAt, isSyncing, triggerSync, status } = useRealtimeSync();
  const [showTooltip, setShowTooltip] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
      const mins = Math.floor(diffMs / 60000);
      setMinutesAgo(Math.max(0, mins));
    };

    updateTime();
    // Cập nhật lại mỗi 10 giây để UI không bị "đứng hình" lâu
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [lastSyncedAt]);

  const isConnected = status === "CONNECTED";

  const statusTitle = isSyncing
    ? "Đang cập nhật số liệu mới..."
    : isConnected
    ? `Trực tuyến (Cập nhật: ${minutesAgo < 1 ? "<1phút trước" : `${minutesAgo} phút trước`})`
    : "Mất kết nối (Đang thử lại)";

  const statusDesc = "Hệ thống tự động đồng bộ dữ liệu theo thời gian thực. Bấm để làm mới dữ liệu thủ công nếu cần thiết.";

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerSync();
        }}
        disabled={isSyncing}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all shadow-sm text-xs font-semibold"
        title={statusTitle}
      >
        <div className="relative flex items-center justify-center">
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
          ) : (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <RefreshCw className="h-3.5 w-3.5" />
            </>
          )}
        </div>

        <span className="min-w-[48px] text-left">
          {isSyncing
            ? "Đang tải..."
            : minutesAgo < 1
            ? "<1phút"
            : `${minutesAgo} phút`}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
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
