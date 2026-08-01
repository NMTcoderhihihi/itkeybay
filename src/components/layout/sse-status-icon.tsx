"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function SSEStatusIcon() {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div 
        className="flex items-center justify-center h-9 w-9 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all shadow-sm"
        title={t('sse.status_tooltip') || "Realtime SSE: Đang kết nối"}
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Activity className="h-4 w-4" />
        </div>
      </div>

      {showTooltip && (
        <div className="absolute right-0 top-11 z-50 w-60 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{t('sse.status_title') || "Realtime SSE: Đang kết nối"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('sse.status_desc') || "Hệ thống đang tự động lắng nghe thay đổi và cập nhật dữ liệu tức thì không cần tải lại trang."}
          </p>
        </div>
      )}
    </div>
  );
}
