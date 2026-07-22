"use client";

import Link from "next/link";
import { useState, useActionState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { saveDanhMuc, deleteDanhMuc } from "@/app/actions/danh-muc";
import { Plus, Edit2, Trash2, Shield, Settings2, Info } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/store/confirm-store";

type DanhMuc = {
  id: string;
  phan_he: string;
  loai_giao_dich: string;
  ten_danh_muc: string;
  la_he_thong: boolean;
  ghi_chu: string;
  dang_hoat_dong: boolean;
};

type PhapHeKey = 'NGUYEN_LIEU' | 'SAN_XUAT' | 'BAN_THANH_PHAM';

const PHAN_HE_LABELS: Record<PhapHeKey, string> = {
  NGUYEN_LIEU: 'Nguyên Liệu',
  SAN_XUAT: 'Sản Xuất',
  BAN_THANH_PHAM: 'Bán Thành Phẩm'
};

const LOAI_GIAO_DICH_LABELS: Record<string, { label: string; color: string }> = {
  NHAP: { label: 'Nhập', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  XUAT: { label: 'Xuất', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  CHINH_SUA: { label: 'Điều chỉnh', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
};

import { useSearchParams } from "next/navigation";

export function DanhMucClient({ initialData, serverTimeMs }: { initialData: DanhMuc[], serverTimeMs: number }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PhapHeKey) || 'NGUYEN_LIEU';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DanhMuc | null>(null);

  // Filtered Data
  const [activeTab, setActiveTab] = useState<PhapHeKey>(initialTab);
  const currentData = initialData.filter(item => item.phan_he === activeTab);

  useEffect(() => {
    // Log hiệu suất để đo đạc thời gian
    console.log(`[Performance] Máy chủ xử lý DB & Render HTML mất: ${serverTimeMs}ms`);
    console.log('[Performance] Giao diện Client đã mount thành công!');
  }, [serverTimeMs]);

  const handleTabChange = (key: PhapHeKey) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `?tab=${key}`);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: DanhMuc) => {
    if (item.la_he_thong) {
      toast.error('Không thể sửa danh mục hệ thống!');
      return;
    }
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const { showConfirm } = useConfirm();

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Bạn có chắc chắn?',
      description: 'Lưu ý: Không thể xoá nếu danh mục đã được sử dụng. Nếu xoá, hành động này không thể hoàn tác.',
      confirmText: 'Xoá ngay',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteDanhMuc(id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Xoá thành công');
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('categories.pageTitle')}</h1>
        <p className="text-muted-foreground">{t('categories.pageDesc')}</p>
      </div>
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
        {(Object.keys(PHAN_HE_LABELS) as PhapHeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {key === 'NGUYEN_LIEU' ? t('categories.rawMaterials') : key === 'SAN_XUAT' ? t('categories.production') : t('categories.semiProducts')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Nút Thêm mới (Card) */}
        <button
          onClick={handleAdd}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50 transition-all min-h-[140px]"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium">Thêm lý do giao dịch</span>
        </button>

        {/* Danh sách Card */}
        {currentData.map(item => (
          <div key={item.id} className={`flex flex-col p-4 border rounded-xl bg-card shadow-sm relative overflow-hidden ${!item.dang_hoat_dong ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2 items-center">
                <h3 className="font-semibold text-base">{item.ten_danh_muc}</h3>
                {item.la_he_thong && (
                  <span title="Mặc định hệ thống">
                    <Shield className="w-4 h-4 text-blue-500" />
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {!item.la_he_thong && (
                  <>
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${LOAI_GIAO_DICH_LABELS[item.loai_giao_dich]?.color || 'bg-muted'}`}>
                  {LOAI_GIAO_DICH_LABELS[item.loai_giao_dich]?.label || item.loai_giao_dich}
                </span>
                {!item.dang_hoat_dong && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
                    Đã tắt
                  </span>
                )}
              </div>
              {item.ghi_chu && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  {item.ghi_chu}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form (Custom) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-background w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/20">
              <h2 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                {editingItem ? 'Sửa Danh mục' : 'Thêm mới Danh mục'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-lg p-1 leading-none">
                &times;
              </button>
            </div>
            <div className="p-4">
              <DanhMucForm 
                initialData={editingItem} 
                phanHe={activeTab} 
                onSuccess={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DanhMucForm({ initialData, phanHe, onSuccess }: { initialData: DanhMuc | null, phanHe: string, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(saveDanhMuc, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(initialData ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      onSuccess();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, initialData, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Hidden fields for ID and phan_he */}
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="phan_he" value={phanHe} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Tên danh mục / Lý do</label>
        <input 
          type="text"
          name="ten_danh_muc"
          defaultValue={initialData?.ten_danh_muc || ''}
          required
          placeholder="VD: Xuất trả liệu dư..."
          className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Loại giao dịch</label>
        <select 
          name="loai_giao_dich"
          defaultValue={initialData?.loai_giao_dich || 'NHAP'}
          className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground"
        >
          <option value="NHAP" className="bg-background text-foreground">Nhập kho</option>
          <option value="XUAT" className="bg-background text-foreground">Xuất kho / Cấp liệu</option>
          <option value="CHINH_SUA" className="bg-background text-foreground">Điều chỉnh / Khác</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Ghi chú (Tùy chọn)</label>
        <textarea 
          name="ghi_chu"
          defaultValue={initialData?.ghi_chu || ''}
          rows={2}
          placeholder="Mô tả chi tiết mục đích..."
          className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Checkbox Trạng thái Hoạt động */}
      <div className="flex items-center gap-2 mt-2">
        <input 
          type="checkbox"
          name="dang_hoat_dong"
          id="dang_hoat_dong"
          value="true"
          defaultChecked={initialData ? initialData.dang_hoat_dong : true}
          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
        />
        <label htmlFor="dang_hoat_dong" className="text-sm cursor-pointer select-none">
          Đang hoạt động (Cho phép sử dụng)
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button 
          type="button" 
          onClick={onSuccess}
          className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
        >
          Huỷ
        </button>
        <button 
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Tạo mới')}
        </button>
      </div>
    </form>
  );
}
