"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
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
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed bg-muted/30 overflow-hidden group", className)}>
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>
          <button 
            type="button"
            className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full translate-x-1/4 -translate-y-1/4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
          >
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">Tải ảnh</span>
            </>
          )}
        </div>
      )}
      <input 
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />
    </div>
  );
}
