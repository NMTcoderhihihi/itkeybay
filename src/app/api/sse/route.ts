import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let intervalId: NodeJS.Timeout | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Gửi sự kiện mở kết nối ban đầu
      const sendEvent = (data: Record<string, unknown>) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error("SSE enqueue error:", err);
        }
      };

      sendEvent({ type: "CONNECTED", time: new Date().toISOString() });

      // Nhịp tim Heartbeat 30 giây tránh đứt kết nối do Proxy/Firewall
      intervalId = setInterval(() => {
        sendEvent({ type: "PING", time: new Date().toISOString() });
      }, 30000);

      // Đăng ký kênh Supabase Realtime lắng nghe toàn cục các bảng cốt lõi
      const channelName = `global-sse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lo_giao_dich" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "lo_giao_dich",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "so_cai_vat_tu" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "so_cai_vat_tu",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "nguyen_lieu" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "nguyen_lieu",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cong_hang" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "cong_hang",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "don_hang" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "don_hang",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tai_khoan" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "tai_khoan",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cong_nhan" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "cong_nhan",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cong_doan" },
          (payload) => {
            sendEvent({
              type: "UPDATE",
              table: "cong_doan",
              eventType: payload.eventType,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .subscribe();

      // Dọn dẹp kết nối khi client hủy yêu cầu
      req.signal.addEventListener("abort", () => {
        if (intervalId) clearInterval(intervalId);
        if (channel) {
          supabase.removeChannel(channel);
        }
        try {
          controller.close();
        } catch {
          // Stream đã được đóng
        }
      });
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
      if (channel) {
        supabase.removeChannel(channel);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
