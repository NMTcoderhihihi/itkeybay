"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";

export function HistoryCongDoanModal({
  congHang,
  congDoanList,
  congNhanList,
  open,
  onOpenChange,
  onPreviewImage
}: {
  congHang: any;
  congDoanList: Array<{ id: string; ten_cong_doan: string }>;
  congNhanList: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewImage?: (url: string) => void;
}) {
  const { t } = useTranslation();
  const completedStages = Array.isArray(congHang?.danh_sach_cong_doan)
    ? congHang.danh_sach_cong_doan.filter((cd: any) => cd.da_xong)
    : [];

  const getWorkerName = (id?: string) => {
    if (!id) return "Chưa định danh";
    const worker = congNhanList.find(cn => cn.id === id);
    return worker ? worker.ho_ten : "Công nhân";
  };

  const getStageName = (id: string) => {
    const cd = congDoanList.find(c => c.id === id);
    return cd ? cd.ten_cong_doan : "Công đoạn";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            {t("production.historyModalTitle")}: {congHang?.ma_cong_hang}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {completedStages.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl bg-muted/20">
              {t("production.historyNoData")}
            </div>
          ) : (
            <div className="relative border-l-2 border-primary/30 ml-3 space-y-6 pl-5 py-2">
              {completedStages.map((cd: any, idx: number) => (
                <div key={idx} className="relative group">
                  {/* Timeline node */}
                  <div className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>

                  <div className="p-3 border rounded-xl bg-card shadow-sm hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {getStageName(cd.id_cong_doan)}
                      </span>
                      <Badge variant="outline" className="text-green-600 border-green-500/40 bg-green-500/10 text-xs">
                        {t("production.completed")}
                      </Badge>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>{t("production.historyWorkerLabel")} <strong className="text-foreground">{getWorkerName(cd.id_cong_nhan)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {t("production.timeLabel")}:{" "}
                          <strong className="text-foreground">
                            {cd.ngay_cap_nhat
                              ? format(new Date(cd.ngay_cap_nhat), "dd/MM/yyyy HH:mm", { locale: vi })
                              : "Đã hoàn thành"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {cd.anh_minh_chung && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Ảnh nghiệm thu:</span>
                        <div
                          className="relative w-12 h-12 rounded-lg border overflow-hidden cursor-zoom-in hover:border-primary transition-colors"
                          onClick={() => onPreviewImage && onPreviewImage(cd.anh_minh_chung)}
                        >
                          <Image src={cd.anh_minh_chung} alt="Evidence" fill className="object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
