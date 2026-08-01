"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { updateCongHangDetails, ChiTietDonHang } from "@/app/actions/san-xuat";

export function EditCongHangModal({
  congHang,
  open,
  onOpenChange,
  onSuccess
}: {
  congHang: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [ghiChu, setGhiChu] = useState(congHang?.ghi_chu || "");
  const [donHangList, setDonHangList] = useState<ChiTietDonHang[]>(
    Array.isArray(congHang?.don_hang) && congHang.don_hang.length > 0
      ? congHang.don_hang.map((d: any) => ({
          ma_don_hang: d.ma_don_hang || "",
          ma_hang: d.ma_hang || "",
          so_luong_san_xuat: d.so_luong_san_xuat || 1
        }))
      : [{ ma_don_hang: "", ma_hang: "", so_luong_san_xuat: 1 }]
  );

  const addDonHang = () => {
    setDonHangList([...donHangList, { ma_don_hang: "", ma_hang: "", so_luong_san_xuat: 1 }]);
  };

  const removeDonHang = (index: number) => {
    if (donHangList.length <= 1) return;
    const newList = [...donHangList];
    newList.splice(index, 1);
    setDonHangList(newList);
  };

  const updateDonHang = (index: number, field: keyof ChiTietDonHang, value: any) => {
    const newList = [...donHangList];
    newList[index] = { ...newList[index], [field]: value };
    setDonHangList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const dh of donHangList) {
      if (!dh.ma_don_hang.trim() || !dh.ma_hang.trim() || dh.so_luong_san_xuat <= 0) {
        return toast.error("Vui lòng điền hợp lệ các đơn hàng (SL > 0)");
      }
    }

    setLoading(true);
    const res = await updateCongHangDetails(congHang.id, ghiChu, donHangList);
    setLoading(false);

    if (res.success) {
      toast.success("Đã cập nhật thông tin công hàng thành công!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } else {
      toast.error(res.error || "Có lỗi khi lưu thay đổi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Chỉnh sửa Thông tin Công Hàng: {congHang?.ma_cong_hang}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Ghi chú công hàng</label>
            <Input
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Thông tin ghi chú..."
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold">Danh sách Đơn hàng & Sản phẩm</label>
              <Button type="button" variant="outline" size="sm" onClick={addDonHang} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Thêm đơn hàng
              </Button>
            </div>

            <div className="space-y-2">
              {donHangList.map((dh, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-end border p-2.5 rounded-lg bg-card">
                  <div className="flex-1 min-w-[130px] space-y-1">
                    <label className="text-[11px] text-muted-foreground">Mã Đơn Hàng</label>
                    <Input
                      value={dh.ma_don_hang}
                      onChange={(e) => updateDonHang(idx, "ma_don_hang", e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px] space-y-1">
                    <label className="text-[11px] text-muted-foreground">Mã Hàng / Sản phẩm</label>
                    <Input
                      value={dh.ma_hang}
                      onChange={(e) => updateDonHang(idx, "ma_hang", e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-[11px] text-muted-foreground">Số Lượng</label>
                    <Input
                      type="number"
                      min={1}
                      value={dh.so_luong_san_xuat}
                      onChange={(e) => updateDonHang(idx, "so_luong_san_xuat", parseInt(e.target.value) || 0)}
                      required
                      className="h-8 text-xs font-bold text-right"
                    />
                  </div>
                  {donHangList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDonHang(idx)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
