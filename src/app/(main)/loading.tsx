import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 w-full animate-in fade-in-50 duration-300">
      {/* 1. Header & Actions Skeleton (Giao diện tĩnh ưu tiên hiển thị trước) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
          <div className="h-3 w-64 bg-muted/60 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted rounded-md animate-pulse" />
          <div className="h-9 w-28 bg-primary/20 rounded-md animate-pulse" />
        </div>
      </div>

      {/* 2. KPI / Summary Cards Skeleton (4 Thẻ trên Desktop, 2x2 Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl border bg-card shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-muted/60 animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-muted rounded-md animate-pulse" />
            <div className="h-2 w-full bg-muted/40 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      {/* 3. Main Content Section (Table & Charts Skeleton) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List Section */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            <div className="h-8 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <div 
                key={row} 
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 animate-pulse"
                style={{ animationDelay: `${row * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart / Side Panel Section */}
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
          <div className="h-52 w-full rounded-lg bg-muted/20 flex items-center justify-center animate-pulse">
            <div className="w-28 h-28 rounded-full border-8 border-muted/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
