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

  const isSyncingRef = useRef<boolean>(false);
  const lastSyncTimeRef = useRef<number>(0);

  // Hàm truy vấn ngầm số liệu mới từ máy chủ (Silent Fetch & DOM Partial Update)
  const triggerSync = useCallback(async () => {
    const now = Date.now();
    // Khóa chống spam/chồng chéo: nếu đang sync, mất mạng, ẩn tab, hoặc khoảng cách giữa 2 lần sync < 10 giây -> bỏ qua
    if (isSyncingRef.current || now - lastSyncTimeRef.current < 10000) return;
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setStatus("DISCONNECTED");
      return;
    }
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      setIsSyncing(true);

      // Thông báo cho các client subscriber (popup/modal/table) để họ tự làm mới số liệu cục bộ
      const event: RealtimeEvent = {
        type: "POLL_UPDATE",
        table: "*",
        timestamp: new Date().toISOString(),
      };
      subscribersRef.current.forEach((sub) => {
        try {
          sub.callback(event);
        } catch (err) {
          console.warn("Lỗi trong callback subscriber Realtime:", err);
        }
      });

      // router.refresh() tự động re-fetch RSC một lần duy nhất mà không reload lại trang
      React.startTransition(() => {
        router.refresh();
      });

      setLastSyncedAt(new Date());
      setStatus("CONNECTED");
    } catch (err) {
      console.warn("Lỗi đồng bộ ngầm Polling (đã tạm qua để thử lại):", err);
      setStatus("DISCONNECTED");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    // Kiến trúc Polling ngầm mỗi 30 giây (Tương thích 100% trên Vercel Serverless)
    const interval = setInterval(() => {
      triggerSync();
    }, 30000);

    // Kích hoạt đồng bộ ngay khi người dùng chuyển lại tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        triggerSync();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
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
      // Nếu là sự kiện POLL_UPDATE ngầm định kỳ -> bỏ qua gọi onUpdate cục bộ để tránh gọi chồng chéo router.refresh()
      if (event.type === "POLL_UPDATE") {
        return;
      }

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
