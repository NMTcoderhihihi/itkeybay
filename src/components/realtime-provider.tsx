"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";

export interface RealtimeEvent {
  type: string;
  table?: string;
  eventType?: string;
  timestamp?: string;
}

type SubscriberCallback = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  subscribe: (tables: string[], callback: SubscriberCallback) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Map<number, { tables: string[]; callback: SubscriberCallback }>>(new Map());
  const nextIdRef = useRef<number>(1);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (!isMounted) return;
      eventSource = new EventSource("/api/sse");

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          if (data.type === "UPDATE" && data.table) {
            subscribersRef.current.forEach((sub) => {
              if (sub.tables.includes(data.table!)) {
                sub.callback(data);
              }
            });
          }
        } catch (err) {
          console.error("Lỗi phân tích sự kiện SSE:", err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Tự động kết nối lại sau 5 giây nếu rớt mạng
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const subscribe = (tables: string[], callback: SubscriberCallback) => {
    const id = nextIdRef.current++;
    subscribersRef.current.set(id, { tables, callback });
    return () => {
      subscribersRef.current.delete(id);
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
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
      // Debounce để tránh kích hoạt tải lại liên tục khi có nhiều thay đổi CSDL xảy ra cùng lúc
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
