"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, X, Image as ImageIcon, Smartphone, Laptop } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(mobileDevice);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Chưa cấu hình Cloudinary');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.secure_url) {
        onChange(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'Lỗi khi upload ảnh');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Lỗi kết nối khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const urlToDelete = value;
    onChange('');
    if (urlToDelete) {
      try {
        await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToDelete })
        });
      } catch (err) {
        console.error('Failed to cleanup Cloudinary image:', err);
      }
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full min-h-[90px] rounded-xl border-2 border-dashed bg-muted/20 overflow-hidden group transition-all", className)}>
      {value ? (
        <div className="relative w-full h-full min-h-[90px] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" className="w-full h-full object-contain p-1" />
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
          <button 
            type="button"
            className="absolute top-1 right-1 p-1 bg-destructive/90 text-destructive-foreground rounded-full shadow-md hover:scale-105 transition-all"
            onClick={handleDelete}
            title="Xóa ảnh"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isMobile ? (
        <div className="w-full h-full flex flex-row items-center justify-center gap-3 p-3 min-h-[86px]">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-1.5 w-full py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Đang tải lên...</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="flex-1 min-w-[110px] flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg border bg-background hover:bg-accent hover:border-primary/50 text-xs font-bold text-primary transition-all shadow-sm"
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              >
                <Camera className="w-5 h-5 text-primary" />
                <span>Chụp ảnh</span>
              </button>
              <button
                type="button"
                className="flex-1 min-w-[110px] flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-lg border bg-background hover:bg-accent hover:border-muted-foreground/50 text-xs font-bold text-muted-foreground transition-all shadow-sm"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span>Thư viện</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3 text-muted-foreground hover:text-primary hover:bg-accent/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-[11px] font-medium">Đang tải lên...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <Laptop className="w-5 h-5 mb-0.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Chọn ảnh từ máy tính (PC)</span>
              <span className="text-[10px] text-muted-foreground">Click để chọn file hình ảnh</span>
            </div>
          )}
        </div>
      )}

      {/* Input cho chọn thư viện hoặc PC */}
      <input 
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />

      {/* Input riêng cho chụp ảnh trực tiếp trên mobile */}
      <input 
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
}
