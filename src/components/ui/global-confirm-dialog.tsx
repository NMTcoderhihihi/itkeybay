"use client";

import { useConfirm } from "@/store/confirm-store";
import { AlertTriangle, Info, XCircle } from "lucide-react";

export function GlobalConfirmDialog() {
  const { isOpen, options, isPending, closeConfirm, setPending } = useConfirm();

  if (!isOpen || !options) return null;

  const handleConfirm = async () => {
    setPending(true);
    try {
      await options.onConfirm();
    } finally {
      closeConfirm();
    }
  };

  const variant = options.variant || 'danger';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-6 pb-4 flex flex-col items-center text-center gap-3`}>
          {variant === 'danger' && (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <XCircle className="w-10 h-10" />
            </div>
          )}
          {variant === 'warning' && (
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
              <AlertTriangle className="w-10 h-10" />
            </div>
          )}
          {variant === 'info' && (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <Info className="w-10 h-10" />
            </div>
          )}
          
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {options.title}
          </h2>
          {options.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {options.description}
            </p>
          )}
        </div>

        <div className="p-4 bg-muted/30 flex gap-3">
          <button
            onClick={closeConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-3 font-semibold text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 disabled:opacity-50 transition-colors"
          >
            {options.cancelText || 'Huỷ bỏ'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={`flex-1 px-4 py-3 font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
              variant === 'warning' ? 'bg-orange-600 hover:bg-orange-700' : 
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? 'Đang xử lý...' : (options.confirmText || 'Xác nhận')}
          </button>
        </div>
      </div>
    </div>
  );
}
