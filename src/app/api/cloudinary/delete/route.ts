import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { publicId, url } = await request.json();
    if (!publicId && !url) {
      return NextResponse.json({ error: "Missing publicId or url" }, { status: 400 });
    }

    // Tách public_id từ URL nếu chỉ có url
    let targetId = publicId;
    if (!targetId && url) {
      const parts = url.split("/");
      const last = parts[parts.length - 1];
      if (last && last.includes(".")) {
        targetId = last.split(".")[0];
      } else {
        targetId = last;
      }
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnrbxq0ju";
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.log(`[Cloudinary Cleanup] API Secret chưa cấu hình trong env. Đã ghi nhận yêu cầu dọn dẹp ảnh rác public_id: ${targetId}`);
      return NextResponse.json({ success: true, message: "Logged cleanup request (dev mode)" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `public_id=${targetId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

    const formData = new URLSearchParams();
    formData.append("public_id", targetId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    console.log(`[Cloudinary Cleanup] Kết quả xóa ảnh ${targetId}:`, result);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[Cloudinary Cleanup] Lỗi:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
