"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const subscribersRef = useRef<Map<number, { tables: string[]; callback: SubscriberCallback }>>(new Map());
  const nextIdRef = useRef<number>(1);
  const [status, setStatus] = useState<RealtimeStatus>("CONNECTING");

  useEffect(() => {
    let isMounted = true;
    const channelName = `global-client-realtime-${Date.now()}`;

    // Kết nối WebSocket trực tiếp từ Trình duyệt Client tới Supabase Realtime
    // Bỏ qua hoàn toàn giới hạn thời gian chạy và đệm (buffering) của Vercel Serverless Function
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          if (!isMounted) return;
          const tableName = payload.table;
          if (tableName) {
            const event: RealtimeEvent = {
              type: "UPDATE",
              table: tableName,
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            };
            subscribersRef.current.forEach((sub) => {
              if (sub.tables.includes(tableName)) {
                sub.callback(event);
              }
            });
          }
        }
      )
      .subscribe((statusEnum) => {
        if (!isMounted) return;
        if (statusEnum === "SUBSCRIBED") {
          setStatus("CONNECTED");
        } else if (statusEnum === "CHANNEL_ERROR" || statusEnum === "TIMED_OUT" || statusEnum === "CLOSED") {
          setStatus("DISCONNECTED");
        } else {
          setStatus("CONNECTING");
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
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
    <RealtimeContext.Provider value={{ subscribe, status }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeStatus(): RealtimeStatus {
  const context = useContext(RealtimeContext);
  return context?.status || "CONNECTED";
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
