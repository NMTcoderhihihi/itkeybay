"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface RealtimeEvent {
  type: string;
  table?: string;
  eventType?: string;
  timestamp?: string;
}

export type RealtimeStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED";

type SubscriberCallback = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  subscribe: (tables: string[], callback: SubscriberCallback) => () => void;
  status: RealtimeStatus;
  lastSyncedAt: Date;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const subscribersRef = useRef<Map<number, { tables: string[]; callback: SubscriberCallback }>>(new Map());
  const nextIdRef = useRef<number>(1);
  
  const [status, setStatus] = useState<RealtimeStatus>("CONNECTED");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Hàm truy vấn ngầm số liệu mới từ máy chủ (Silent Fetch & DOM Partial Update)
  const triggerSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      // router.refresh() tự động re-fetch Server Components/Actions của trang hiện tại mà không reload lại trang
      router.refresh();

      // Thông báo cho các client subscriber (popup/modal/table) để cập nhật state cục bộ
      const event: RealtimeEvent = {
        type: "POLL_UPDATE",
        table: "*",
        timestamp: new Date().toISOString(),
      };
      subscribersRef.current.forEach((sub) => {
        sub.callback(event);
      });

      setLastSyncedAt(new Date());
      setStatus("CONNECTED");
    } catch (err) {
      console.error("Lỗi đồng bộ ngầm Polling:", err);
      setStatus("DISCONNECTED");
    } finally {
      setIsSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    // Kiến trúc Polling ngầm mỗi 30 giây (Tương thích 100% trên Vercel Serverless)
    const interval = setInterval(() => {
      // Tối ưu hóa: Nếu tab trình duyệt đang bị ẩn/thu nhỏ -> không thực hiện truy vấn để tránh lãng phí tài nguyên Vercel
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      triggerSync();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [triggerSync]);

  const subscribe = (tables: string[], callback: SubscriberCallback) => {
    const id = nextIdRef.current++;
    subscribersRef.current.set(id, { tables, callback });
    return () => {
      subscribersRef.current.delete(id);
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe, status, lastSyncedAt, isSyncing, triggerSync }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeStatus(): RealtimeStatus {
  const context = useContext(RealtimeContext);
  return context?.status || "CONNECTED";
}

export function useRealtimeSync() {
  const context = useContext(RealtimeContext);
  return {
    lastSyncedAt: context?.lastSyncedAt || new Date(),
    isSyncing: context?.isSyncing || false,
    triggerSync: context?.triggerSync || (async () => {}),
    status: context?.status || "CONNECTED",
  };
}

export function useRealtimeSSE({
  tables,
  onUpdate,
  debounceMs = 1500,
}: {
  tables: string[];
  onUpdate: (event: RealtimeEvent) => void;
  debounceMs?: number;
}) {
  const context = useContext(RealtimeContext);
  const onUpdateRef = useRef(onUpdate);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!context) {
      console.warn("useRealtimeSSE phải được sử dụng bên trong <RealtimeProvider>");
      return;
    }

    const unsubscribe = context.subscribe(tables, (event) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onUpdateRef.current(event);
      }, debounceMs);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [context, JSON.stringify(tables), debounceMs]);
}
