"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveDanhMuc, deleteDanhMuc } from "@/app/actions/danh-muc";
import { Plus, Trash2, Shield, Settings2, Info, Search, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/store/confirm-store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";

type DanhMuc = {
  id: string;
  phan_he: string;
  loai_giao_dich: string;
  ten_danh_muc: string;
  la_he_thong: boolean;
  ghi_chu: string;
  dang_hoat_dong: boolean;
};

export function DanhMucClient({ initialData, serverTimeMs }: { initialData: DanhMuc[], serverTimeMs: number }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DanhMuc | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPhanHe, setFilterPhanHe] = useState<string>("ALL");
  const [filterLoaiGD, setFilterLoaiGD] = useState<string>("ALL");

  useEffect(() => {
    console.log(`[Performance] Máy chủ xử lý DB & Render HTML mất: ${serverTimeMs}ms`);
  }, [serverTimeMs]);

  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      const matchSearch = item.ten_danh_muc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPhanHe = filterPhanHe === "ALL" || item.phan_he === filterPhanHe;
      const matchLoaiGD = filterLoaiGD === "ALL" || item.loai_giao_dich === filterLoaiGD;
      return matchSearch && matchPhanHe && matchLoaiGD;
    });
  }, [initialData, searchQuery, filterPhanHe, filterLoaiGD]);

  const handleAdd = () => {
    setEditingItem(null);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleRowClick = (item: DanhMuc) => {
    setEditingItem(item);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const phanHeLabels: Record<string, string> = {
    NGUYEN_LIEU: t('categories.rawMaterials'),
    BAN_THANH_PHAM: t('categories.semiProducts'),
    SAN_XUAT: t('categories.production')
  };

  return (
    <div className="flex flex-col gap-6">


      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('categories.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <Select value={filterPhanHe} onValueChange={(val) => setFilterPhanHe(val || "ALL")}>
            <SelectTrigger className="bg-background shrink-0 w-fit">
              <span className="flex flex-1 text-left">
                {filterPhanHe === "ALL" ? t('categories.allObjects') : 
                 filterPhanHe === "NGUYEN_LIEU" ? t('categories.rawMaterials') : 
                 filterPhanHe === "BAN_THANH_PHAM" ? t('categories.semiProducts') : t('categories.object')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('categories.allObjects')}</SelectItem>
              <SelectItem value="NGUYEN_LIEU">{t('categories.rawMaterials')}</SelectItem>
              <SelectItem value="BAN_THANH_PHAM">{t('categories.semiProducts')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLoaiGD} onValueChange={(val) => setFilterLoaiGD(val || "ALL")}>
            <SelectTrigger className="bg-background shrink-0 w-fit">
              <span className="flex flex-1 text-left">
                {filterLoaiGD === "ALL" ? t('categories.allTransactions') : 
                 filterLoaiGD === "NHAP" ? t('categories.import') : 
                 filterLoaiGD === "XUAT" ? t('categories.export') : t('categories.transaction')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('categories.allTransactions')}</SelectItem>
              <SelectItem value="NHAP">{t('categories.import')}</SelectItem>
              <SelectItem value="XUAT">{t('categories.export')}</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleAdd} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> {t('categories.addCategory')}
          </Button>
        </div>
      </div>

      {/* List View */}
      <div className="rounded-xl border shadow-sm overflow-x-auto bg-card">
        <div className="flex flex-col min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-[250px_150px_1fr] md:grid-cols-[350px_200px_1fr] gap-4 p-3 md:p-4 bg-muted/80 border-b text-sm font-semibold text-foreground">
            <div>{t('categories.categoryName')}</div>
            <div className="text-center">{t('categories.type')}</div>
            <div>{t('categories.object')}</div>
          </div>

          {/* Data Rows */}
          <div className="flex flex-col divide-y">
            {filteredData.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">{t('categories.notFound')}</div>
            ) : (
              filteredData.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleRowClick(item)}
                  className={`grid grid-cols-[250px_150px_1fr] md:grid-cols-[350px_200px_1fr] gap-4 p-3 md:p-4 items-center transition-colors hover:bg-accent cursor-pointer ${!item.dang_hoat_dong ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
                    <span className="font-medium">{item.ten_danh_muc}</span>
                    {item.la_he_thong && <span title={t('categories.system')}><Shield className="w-4 h-4 text-blue-500 shrink-0" /></span>}
                    {!item.dang_hoat_dong && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm shrink-0">{t('categories.disabled')}</span>}
                  </div>
                  <div className="flex justify-center overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
                    {item.loai_giao_dich === 'NHAP' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <PlusCircle className="w-3.5 h-3.5" /> {t('categories.import').replace(' (+)', '')}
                      </span>
                    ) : item.loai_giao_dich === 'XUAT' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <MinusCircle className="w-3.5 h-3.5" /> {t('categories.export').replace(' (-)', '')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {t('categories.other')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
                    {phanHeLabels[item.phan_he] || item.phan_he}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-background w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                {editingItem ? t('categories.details') : t('categories.createNew')}
              </h2>
              <div className="flex items-center gap-3">
                {editingItem && (
                  <button 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isEditMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {isEditMode ? t('categories.editing') : t('categories.viewOnly')}
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none px-1">
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <DanhMucForm 
                initialData={editingItem} 
                isEditMode={isEditMode}
                onSuccess={() => {
                  setIsModalOpen(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DanhMucForm({ initialData, isEditMode, onSuccess }: { initialData: DanhMuc | null, isEditMode: boolean, onSuccess: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveDanhMuc, null);
  const { showConfirm } = useConfirm();

  useEffect(() => {
    if (state?.success) {
      toast.success(initialData ? t('categories.updateSuccess') : t('categories.addSuccess'));
      router.refresh();
      onSuccess();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, initialData, onSuccess, t, router]);

  const handleDelete = () => {
    if (!initialData) return;
    showConfirm({
      title: t('categories.confirmDeleteTitle'),
      description: t('categories.confirmDeleteDesc'),
      confirmText: t('categories.deleteBtn'),
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteDanhMuc(initialData.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(t('categories.deleteSuccess'));
          router.refresh();
          onSuccess();
        }
      }
    });
  };

  const phanHeLabels: Record<string, string> = {
    NGUYEN_LIEU: t('categories.rawMaterials'),
    BAN_THANH_PHAM: t('categories.semiProducts'),
    SAN_XUAT: t('categories.production')
  };

  const canEdit = isEditMode && (!initialData || !initialData.la_he_thong);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      
      {initialData?.la_he_thong && isEditMode && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-2 flex gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{t('categories.systemWarning')}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>{t('categories.categoryNameLabel')}</Label>
        {canEdit ? (
          <Input 
            type="text"
            name="ten_danh_muc"
            defaultValue={initialData?.ten_danh_muc || ''}
            required
            placeholder={t('categories.categoryNamePlaceholder')}
            className="w-full bg-background"
          />
        ) : (
          <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 font-medium">{initialData?.ten_danh_muc}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>{t('categories.object')}</Label>
          {canEdit ? (
            <select 
              name="phan_he"
              defaultValue={initialData?.phan_he || 'NGUYEN_LIEU'}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background"
            >
              <option value="NGUYEN_LIEU">{t('categories.rawMaterials')}</option>
              <option value="BAN_THANH_PHAM">{t('categories.semiProducts')}</option>
            </select>
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">{phanHeLabels[initialData?.phan_he || ''] || initialData?.phan_he}</div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('categories.type')}</Label>
          {canEdit ? (
            <select 
              name="loai_giao_dich"
              defaultValue={initialData?.loai_giao_dich || 'NHAP'}
              className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background"
            >
              <option value="NHAP">{t('categories.import')}</option>
              <option value="XUAT">{t('categories.export')}</option>
              {initialData?.loai_giao_dich === 'CHINH_SUA' && <option value="CHINH_SUA">{t('categories.other')}</option>}
            </select>
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">
              {initialData?.loai_giao_dich === 'NHAP' ? t('categories.import') : initialData?.loai_giao_dich === 'XUAT' ? t('categories.export') : t('categories.other')}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t('categories.note')}</Label>
        {canEdit ? (
          <textarea 
            name="ghi_chu"
            defaultValue={initialData?.ghi_chu || ''}
            rows={3}
            placeholder={t('categories.notePlaceholder')}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background"
          />
        ) : (
          <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 min-h-[60px] whitespace-pre-wrap text-muted-foreground">{initialData?.ghi_chu || t('categories.noNote')}</div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        {canEdit ? (
          <>
            <input 
              type="checkbox"
              name="dang_hoat_dong"
              id="dang_hoat_dong"
              value="true"
              defaultChecked={initialData ? initialData.dang_hoat_dong : true}
              className="w-4 h-4 text-primary rounded border-input focus:ring-primary"
            />
            <Label htmlFor="dang_hoat_dong" className="cursor-pointer select-none">
              {t('categories.active')}
            </Label>
          </>
        ) : (
          <div className={`text-sm font-medium px-2.5 py-1 rounded-md ${initialData?.dang_hoat_dong ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
            {initialData?.dang_hoat_dong ? t('categories.statusActive') : t('categories.statusInactive')}
          </div>
        )}
      </div>

      {isEditMode && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          {initialData && !initialData.la_he_thong ? (
            <button 
              type="button" 
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> {t('common.delete')}
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={onSuccess}
              className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              {t('categories.closeBtn')}
            </button>
            {canEdit && (
              <button 
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? t('categories.saving') : (initialData ? t('categories.saveChanges') : t('common.add'))}
              </button>
            )}
          </div>
        </div>
      )}
      
      {!isEditMode && (
        <div className="flex justify-end mt-4 pt-4 border-t">
          <button 
            type="button" 
            onClick={onSuccess}
            className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            {t('categories.closeBtn')}
          </button>
        </div>
      )}
    </form>
  );
}
