"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

  // Hàm truy vấn làm mới số liệu ngầm từ máy chủ (dùng khi quay lại tab hoặc nhấn nút refresh thủ công)
  const triggerSync = useCallback(async () => {
    const now = Date.now();
    // Khóa chống spam/chồng chéo: nếu đang sync, mất mạng, ẩn tab, hoặc khoảng cách giữa 2 lần sync < 15 giây -> bỏ qua
    if (isSyncingRef.current || now - lastSyncTimeRef.current < 15000) return;
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

      // router.refresh() tự động re-fetch RSC một lần duy nhất mà không reload lại trang
      React.startTransition(() => {
        router.refresh();
      });

      setLastSyncedAt(new Date());
      setStatus("CONNECTED");
    } catch (err) {
      console.warn("Lỗi làm mới dữ liệu:", err);
      setStatus("DISCONNECTED");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const coreTables = [
      "lo_giao_dich",
      "so_cai_vat_tu",
      "nguyen_lieu",
      "cong_hang",
      "don_hang",
      "tai_khoan",
      "cong_nhan",
      "cong_doan",
      "danh_muc_giao_dich",
    ];

    try {
      setStatus("CONNECTING");
      // Mở đúng 01 Kênh WebSocket duy nhất tới Supabase Realtime Server
      channel = supabase.channel("global-app-realtime");

      coreTables.forEach((table) => {
        channel!.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            const event: RealtimeEvent = {
              type: "UPDATE",
              table: payload.table,
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            };

            // Phân phối sự kiện tới đúng các Subscriber đang theo dõi bảng này (cách ly sự kiện theo trang)
            subscribersRef.current.forEach((sub) => {
              if (
                sub.tables.includes("*") ||
                (event.table && sub.tables.includes(event.table))
              ) {
                try {
                  sub.callback(event);
                } catch (err) {
                  console.warn("Lỗi trong callback subscriber Realtime:", err);
                }
              }
            });
          }
        );
      });

      channel.subscribe((statusResult) => {
        if (statusResult === "SUBSCRIBED") {
          setStatus("CONNECTED");
          setLastSyncedAt(new Date());
        } else if (
          statusResult === "CLOSED" ||
          statusResult === "CHANNEL_ERROR" ||
          statusResult === "TIMED_OUT"
        ) {
          setStatus("DISCONNECTED");
        }
      });
    } catch (err) {
      console.warn("Lỗi kết nối Supabase Realtime WebSocket:", err);
      setStatus("DISCONNECTED");
    }

    // Kích hoạt đồng bộ một lần khi người dùng chuyển lại tab sau khi offline lâu
    const handleVisibilityChange = () => {
      if (!document.hidden && window.navigator.onLine) {
        triggerSync();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
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
      // Dùng cơ chế Debounce nhằm gộp nhiều sự kiện DB liên tiếp thành 1 lần làm mới duy nhất
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        try {
          onUpdateRef.current(event);
        } catch (err) {
          console.warn("Lỗi khi xử lý onUpdate Realtime:", err);
        }
      }, debounceMs);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [context, JSON.stringify(tables), debounceMs]);
}

