"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GitBranch, Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface QuyTrinh {
  id: string;
  ten_quy_trinh: string;
  ma_quy_trinh: string;
  cong_doan_ids: string[];
}

export function generateMaQuyTrinh(name: string): string {
  if (!name || !name.trim()) return "QT-???";
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  const words = cleanName.trim().split(/\s+/);
  const abbr = words
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, "");
  return `QT-${abbr || "SX"}`;
}

const STORAGE_KEY = "itkeybay_quy_trinh_list";

export function useQuyTrinhList(defaultCongDoanIds: string[] = []) {
  const [quyTrinhList, setQuyTrinhList] = useState<QuyTrinh[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setQuyTrinhList(JSON.parse(stored));
      } else if (defaultCongDoanIds.length > 0) {
        // Mặc định tạo 2 quy trình mẫu để dùng ngay
        const defaults: QuyTrinh[] = [
          {
            id: "qt-blv",
            ten_quy_trinh: "Bàn Làm Việc",
            ma_quy_trinh: "QT-BLV",
            cong_doan_ids: defaultCongDoanIds.slice(0, 4)
          },
          {
            id: "qt-tqa",
            ten_quy_trinh: "Tủ Quần Áo",
            ma_quy_trinh: "QT-TQA",
            cong_doan_ids: defaultCongDoanIds
          }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        setQuyTrinhList(defaults);
      }
    } catch (e) {
      console.error("Error loading quy trinh:", e);
    }
  }, [defaultCongDoanIds.length]);

  const saveList = (list: QuyTrinh[]) => {
    setQuyTrinhList(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error saving quy trinh:", e);
    }
  };

  return { quyTrinhList, saveList };
}

export function QuyTrinhManagerModal({
  congDoanList,
  onSelectQuyTrinh
}: {
  congDoanList: Array<{ id: string; ten_cong_doan: string }>;
  onSelectQuyTrinh?: (qt: QuyTrinh) => void;
}) {
  const { quyTrinhList, saveList } = useQuyTrinhList(congDoanList.map(c => c.id));
  const [open, setOpen] = useState(false);
  const [tenQuyTrinh, setTenQuyTrinh] = useState("");
  const [maQuyTrinh, setMaQuyTrinh] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleNameChange = (val: string) => {
    setTenQuyTrinh(val);
    setMaQuyTrinh(generateMaQuyTrinh(val));
  };

  const toggleCongDoan = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newArr = [...selectedIds];
    if (direction === "up" && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === "down" && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    setSelectedIds(newArr);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenQuyTrinh.trim()) return toast.error("Vui lòng nhập tên quy trình");
    if (selectedIds.length === 0) return toast.error("Vui lòng chọn ít nhất 1 công đoạn");

    const newQt: QuyTrinh = {
      id: "qt-" + Date.now(),
      ten_quy_trinh: tenQuyTrinh.trim(),
      ma_quy_trinh: maQuyTrinh || generateMaQuyTrinh(tenQuyTrinh),
      cong_doan_ids: selectedIds
    };

    const updated = [newQt, ...quyTrinhList];
    saveList(updated);
    toast.success(`Đã tạo quy trình "${newQt.ten_quy_trinh}" (${newQt.ma_quy_trinh})`);

    setTenQuyTrinh("");
    setMaQuyTrinh("");
    setSelectedIds([]);

    if (onSelectQuyTrinh) {
      onSelectQuyTrinh(newQt);
      setOpen(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const updated = quyTrinhList.filter(item => item.id !== id);
    saveList(updated);
    toast.success(`Đã xóa quy trình "${name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <GitBranch className="w-4 h-4 mr-1.5" /> Quản lý Quy trình
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Tạo & Quản Lý Quy Trình Sản Xuất
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 border p-4 rounded-xl bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Tên Quy Trình (Tên sản phẩm) <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Bàn Làm Việc..."
                value={tenQuyTrinh}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">
                Mã Quy Trình (Tự động sinh)
              </label>
              <Input
                value={maQuyTrinh}
                readOnly
                className="mt-1 h-9 font-mono font-bold bg-muted/60 text-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Chọn danh sách & thứ tự công đoạn ({selectedIds.length}/{congDoanList.length})
              </label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-6 text-xs p-0"
                onClick={() => setSelectedIds(congDoanList.map(c => c.id))}
              >
                Chọn tất cả
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border rounded-lg bg-background">
              {congDoanList.map(cd => {
                const checked = selectedIds.includes(cd.id);
                return (
                  <label
                    key={cd.id}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                      checked ? "bg-primary/10 border-primary text-primary font-semibold" : "hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCongDoan(cd.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="truncate">{cd.ten_cong_doan}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="p-2.5 rounded-lg border bg-background space-y-1">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                Thứ tự thực hiện đã chọn:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedIds.map((id, index) => {
                  const cdName = congDoanList.find(c => c.id === id)?.ten_cong_doan || id;
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1 py-1 text-xs">
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      {cdName}
                      <div className="flex items-center ml-1">
                        <button
                          type="button"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          className="hover:text-primary disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, "down")}
                          disabled={index === selectedIds.length - 1}
                          className="hover:text-primary disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Lưu Quy Trình
            </Button>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase">
            Danh sách Quy trình hiện có ({quyTrinhList.length})
          </h4>
          {quyTrinhList.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
              Chưa có quy trình nào. Hãy tạo mới ở phía trên.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {quyTrinhList.map(qt => (
                <div
                  key={qt.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/60 transition-all bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{qt.ten_quy_trinh}</span>
                      <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/10">
                        {qt.ma_quy_trinh}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      {qt.cong_doan_ids.map((cid, i) => {
                        const name = congDoanList.find(c => c.id === cid)?.ten_cong_doan || "CD";
                        return (
                          <span key={cid} className="inline-flex items-center">
                            {i > 0 && <span className="mx-1">→</span>}
                            <span>{name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onSelectQuyTrinh && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => {
                          onSelectQuyTrinh(qt);
                          setOpen(false);
                        }}
                      >
                        Chọn
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(qt.id, qt.ten_quy_trinh)}
                      title="Xóa quy trình"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
