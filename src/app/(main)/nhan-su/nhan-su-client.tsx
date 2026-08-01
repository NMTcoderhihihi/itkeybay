"use client";

import Link from "next/link";
import { useState, useActionState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { saveTaiKhoan, deleteTaiKhoan, saveCongNhan, deleteCongNhan } from "@/app/actions/nhan-su";
import { Plus, Trash2, Settings2, Shield, Eye, EyeOff, CheckCircle2, XCircle, HardHat, Phone, User, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/store/confirm-store";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useSearchParams, useRouter } from "next/navigation";
import { useRealtimeSSE } from "@/components/realtime-provider";

type NhanSuTab = 'TAI_KHOAN' | 'CONG_NHAN';

export function NhanSuClient({ taiKhoanData, congNhanData, serverTimeMs }: { taiKhoanData: any[], congNhanData: any[], serverTimeMs: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'CONG_NHAN' ? 'CONG_NHAN' : 'TAI_KHOAN';
  const [activeTab, setActiveTab] = useState<NhanSuTab>(initialTab);

  useRealtimeSSE({
    tables: ["tai_khoan", "cong_nhan", "lo_giao_dich"],
    onUpdate: () => {
      router.refresh();
    },
  });
  
  const [isTaiKhoanModalOpen, setIsTaiKhoanModalOpen] = useState(false);
  const [editingTaiKhoan, setEditingTaiKhoan] = useState<any>(null);
  
  const [isCongNhanModalOpen, setIsCongNhanModalOpen] = useState(false);
  const [editingCongNhan, setEditingCongNhan] = useState<any>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log(`[Performance] Máy chủ xử lý DB & Render HTML mất: ${serverTimeMs}ms`);
  }, [serverTimeMs]);

  const handleTabChange = (key: NhanSuTab) => {
    setActiveTab(key);
    setSearchQuery("");
    window.history.replaceState(null, '', `?tab=${key}`);
  };

  const filteredTaiKhoan = useMemo(() => {
    return taiKhoanData.filter(item => 
      item.ho_ten.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.tai_khoan.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [taiKhoanData, searchQuery]);

  const filteredCongNhan = useMemo(() => {
    return congNhanData.filter(item => 
      item.ho_ten.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.ma_cong_nhan.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [congNhanData, searchQuery]);

  // Handlers for Tài khoản
  const handleAddTaiKhoan = () => { setEditingTaiKhoan(null); setIsEditMode(true); setIsTaiKhoanModalOpen(true); };
  const handleRowClickTaiKhoan = (item: any) => { setEditingTaiKhoan(item); setIsEditMode(false); setIsTaiKhoanModalOpen(true); };
  
  // Handlers for Công nhân
  const handleAddCongNhan = () => { setEditingCongNhan(null); setIsEditMode(true); setIsCongNhanModalOpen(true); };
  const handleRowClickCongNhan = (item: any) => { setEditingCongNhan(item); setIsEditMode(false); setIsCongNhanModalOpen(true); };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-4">


      {/* Tabs */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
        <button
          onClick={() => handleTabChange('TAI_KHOAN')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'TAI_KHOAN' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" /> {t('personnel.systemAccounts')}
        </button>
        <button
          onClick={() => handleTabChange('CONG_NHAN')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'CONG_NHAN' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <HardHat className="w-4 h-4" /> {t('personnel.workers')}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'TAI_KHOAN' ? 'Tìm kiếm tài khoản, tên nhân viên...' : 'Tìm kiếm mã công nhân, tên...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-background"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {activeTab === 'TAI_KHOAN' ? (
            <Button onClick={handleAddTaiKhoan} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
            </Button>
          ) : (
            <Button onClick={handleAddCongNhan} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Thêm công nhân
            </Button>
          )}
        </div>
      </div>

      {/* List View */}
      <div className="rounded-xl border shadow-sm overflow-x-auto bg-card">
        <div className="flex flex-col min-w-[600px]">
          {activeTab === 'TAI_KHOAN' ? (
            <>
              <div className="grid grid-cols-[200px_110px_130px_1fr] md:grid-cols-[250px_130px_150px_1fr] gap-3 p-3 md:p-4 bg-muted/80 border-b text-sm font-semibold text-foreground">
                <div>Thông tin nhân viên</div>
                <div>Vai trò</div>
                <div>Trạng thái phiên</div>
                <div>Giao dịch cuối cùng</div>
              </div>
              <div className="flex flex-col divide-y">
                {filteredTaiKhoan.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Không tìm thấy tài khoản nào.</div>
                ) : (
                  filteredTaiKhoan.map(item => (
                    <TaiKhoanRow key={item.id} item={item} onClick={() => handleRowClickTaiKhoan(item)} />
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-[250px_200px_1fr] md:grid-cols-[300px_250px_1fr] gap-4 p-3 md:p-4 bg-muted/80 border-b text-sm font-semibold text-foreground">
                <div>Thông tin công nhân</div>
                <div>Số điện thoại</div>
                <div>Vị trí</div>
              </div>
              <div className="flex flex-col divide-y">
                {filteredCongNhan.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Không tìm thấy công nhân nào.</div>
                ) : (
                  filteredCongNhan.map(item => (
                    <CongNhanRow key={item.id} item={item} onClick={() => handleRowClickCongNhan(item)} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TAI KHOAN MODAL */}
      {isTaiKhoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {editingTaiKhoan ? "Chi tiết / Sửa Tài Khoản" : "Thêm Tài Khoản Mới"}
              </h3>
              <div className="flex items-center gap-2">
                {editingTaiKhoan && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className="h-8 px-3 text-xs"
                  >
                    {isEditMode ? "Hủy Sửa" : "Chỉnh Sửa"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsTaiKhoanModalOpen(false)} className="h-8 w-8 p-0">✕</Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <TaiKhoanForm 
                initialData={editingTaiKhoan} 
                isEditMode={!editingTaiKhoan || isEditMode}
                onSuccess={() => setIsTaiKhoanModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* CONG NHAN MODAL */}
      {isCongNhanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HardHat className="w-5 h-5 text-primary" />
                {editingCongNhan ? "Chi tiết / Sửa Công Nhân" : "Thêm Công Nhân Mới"}
              </h3>
              <div className="flex items-center gap-2">
                {editingCongNhan && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditMode(!isEditMode)} 
                    className="h-8 px-3 text-xs"
                  >
                    {isEditMode ? "Hủy Sửa" : "Chỉnh Sửa"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsCongNhanModalOpen(false)} className="h-8 w-8 p-0">✕</Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <CongNhanForm 
                initialData={editingCongNhan} 
                isEditMode={!editingCongNhan || isEditMode}
                onSuccess={() => setIsCongNhanModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================
// LIST ROWS COMPONENTS
// ===================================
function TaiKhoanRow({ item, onClick }: { item: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`grid grid-cols-[200px_110px_130px_1fr] md:grid-cols-[250px_130px_150px_1fr] gap-3 p-3 md:p-4 items-center transition-colors hover:bg-accent cursor-pointer ${!item.dang_hoat_dong ? 'opacity-60 bg-muted/30' : ''}`}
    >
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary overflow-hidden shrink-0 border border-muted-foreground/20">
          {item.anh_dai_dien ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.anh_dai_dien} alt={item.ho_ten} className="w-full h-full object-contain bg-muted/30 p-0.5" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary-foreground font-bold text-xs md:text-sm">
              {item.ho_ten.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm flex items-center gap-2">
            {item.ho_ten}
            {!item.dang_hoat_dong && <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-sm shrink-0 font-medium">Đã khóa</span>}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {item.tai_khoan}</span>
        </div>
      </div>

      <div className="flex items-center">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${item.vai_tro === 'Quan ly' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground border'}`}>
          {item.vai_tro === 'Quan ly' ? 'Quản lý' : 'Nhân viên'}
        </span>
      </div>

      <div className="flex items-center">
        {item.is_online ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Đang hoạt động
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
            Offline
          </span>
        )}
      </div>

      <div className="flex flex-col text-xs truncate">
        {item.giao_dich_cuoi ? (
          <>
            <span className="font-medium text-foreground truncate">{item.giao_dich_cuoi.ten_danh_muc}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(item.giao_dich_cuoi.created_at).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground italic">Chưa có giao dịch</span>
        )}
      </div>
    </div>
  );
}

function CongNhanRow({ item, onClick }: { item: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`grid grid-cols-[250px_200px_1fr] md:grid-cols-[300px_250px_1fr] gap-4 p-3 md:p-4 items-center transition-colors hover:bg-accent cursor-pointer`}
    >
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary overflow-hidden shrink-0 border border-muted-foreground/20">
          <div className="w-full h-full flex items-center justify-center text-secondary-foreground font-bold text-xs md:text-sm">
            {item.ho_ten.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm flex items-center gap-2">
            {item.ho_ten}
          </span>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><HardHat className="w-3 h-3" /> {item.ma_cong_nhan}</span>
        </div>
      </div>
      <div className="flex items-center text-sm overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 -mb-1">
        {item.so_dien_thoai ? (
          <span className="flex items-center gap-1.5 bg-secondary px-2 py-0.5 rounded font-mono text-secondary-foreground"><Phone className="w-3.5 h-3.5" /> {item.so_dien_thoai}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Không có</span>
        )}
      </div>
      <div className="flex items-center">
        <span className="text-sm font-medium text-foreground truncate">{item.vai_tro || 'Chưa phân công'}</span>
      </div>
    </div>
  );
}

// ===================================
// FORMS
// ===================================
function TaiKhoanForm({ initialData, isEditMode, onSuccess }: { initialData: any, isEditMode: boolean, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(saveTaiKhoan, null);
  const [avatar, setAvatar] = useState(initialData?.anh_dai_dien || '');
  const { showConfirm } = useConfirm();

  useEffect(() => {
    if (state?.success) { toast.success('Lưu thành công'); onSuccess(); }
    if (state?.error) { toast.error(state.error); }
  }, [state, onSuccess]);

  const handleDelete = () => {
    if (!initialData) return;
    showConfirm({
      title: 'Khóa / Xóa Tài khoản?',
      description: `Bạn có chắc muốn xóa tài khoản ${initialData.ho_ten}? Nếu đã có phiếu giao dịch, tài khoản chỉ bị khóa. Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa ngay',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteTaiKhoan(initialData.id);
        if (res.error) toast.error(res.error);
        else { toast.success('Đã xử lý tài khoản thành công'); onSuccess(); }
      }
    });
  };

  const canEdit = isEditMode;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="anh_dai_dien" value={avatar} />

      <div className="flex justify-center mb-2">
        {canEdit ? (
          <ImageUpload value={avatar} onChange={setAvatar} />
        ) : (
          <div className="w-24 h-24 rounded-full border-2 overflow-hidden bg-muted">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground text-2xl font-bold">
                {initialData?.ho_ten?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Họ Tên</Label>
          {canEdit ? (
            <Input type="text" name="ho_ten" defaultValue={initialData?.ho_ten} required className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 font-medium">{initialData?.ho_ten}</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tài khoản</Label>
          {canEdit ? (
            <Input type="text" name="tai_khoan" defaultValue={initialData?.tai_khoan} required className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">{initialData?.tai_khoan}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Mật khẩu</Label>
          {canEdit ? (
            <Input type="text" name="mat_khau" defaultValue={initialData?.mat_khau} required placeholder="VD: 123456" className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 font-mono">••••••••</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Vai trò</Label>
          {canEdit ? (
            <select name="vai_tro" defaultValue={initialData?.vai_tro || 'Nhan vien'} className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background">
              <option value="Nhan vien">Nhân viên</option>
              <option value="Quan ly">Quản lý</option>
            </select>
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">
              {initialData?.vai_tro === 'Quan ly' ? 'Quản lý' : 'Nhân viên'}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {canEdit ? (
          <>
            <input type="checkbox" name="dang_hoat_dong" id="dang_hoat_dong_tk" value="true" defaultChecked={initialData ? initialData.dang_hoat_dong : true} className="w-4 h-4 text-primary rounded border-input focus:ring-primary" />
            <Label htmlFor="dang_hoat_dong_tk" className="cursor-pointer select-none">Tài khoản đang hoạt động (Cho phép đăng nhập)</Label>
          </>
        ) : (
          <div className={`text-sm font-medium px-2.5 py-1 rounded-md ${initialData?.dang_hoat_dong ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
            Trạng thái: {initialData?.dang_hoat_dong ? 'Đang hoạt động' : 'Đã khóa'}
          </div>
        )}
      </div>

      <FormFooter isEditMode={isEditMode} isPending={isPending} initialData={initialData} onSuccess={onSuccess} onDelete={handleDelete} />
    </form>
  );
}

function CongNhanForm({ initialData, isEditMode, onSuccess }: { initialData: any, isEditMode: boolean, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(saveCongNhan, null);
  const { showConfirm } = useConfirm();

  useEffect(() => {
    if (state?.success) { toast.success('Lưu thành công'); onSuccess(); }
    if (state?.error) { toast.error(state.error); }
  }, [state, onSuccess]);

  const handleDelete = () => {
    if (!initialData) return;
    showConfirm({
      title: 'Xóa Công nhân?',
      description: `Bạn có chắc muốn xóa công nhân ${initialData.ho_ten}? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa ngay',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteCongNhan(initialData.id);
        if (res.error) toast.error(res.error);
        else { toast.success('Đã xóa công nhân'); onSuccess(); }
      }
    });
  };

  const canEdit = isEditMode;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Mã Công nhân</Label>
          {canEdit ? (
            <Input type="text" name="ma_cong_nhan" defaultValue={initialData?.ma_cong_nhan} required placeholder="VD: CN-001" className="font-mono bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 font-mono font-medium">{initialData?.ma_cong_nhan}</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Họ Tên</Label>
          {canEdit ? (
            <Input type="text" name="ho_ten" defaultValue={initialData?.ho_ten} required className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 font-medium">{initialData?.ho_ten}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Chuyên môn / Vị trí</Label>
          {canEdit ? (
            <Input type="text" name="vai_tro" defaultValue={initialData?.vai_tro} placeholder="VD: Thợ sơn" className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">{initialData?.vai_tro || 'Chưa phân công'}</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Số điện thoại</Label>
          {canEdit ? (
            <Input type="tel" name="so_dien_thoai" defaultValue={initialData?.so_dien_thoai} className="bg-background" />
          ) : (
            <div className="px-3 py-2 border rounded-md text-sm bg-muted/30">{initialData?.so_dien_thoai || 'Không có'}</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Ghi chú</Label>
        {canEdit ? (
          <textarea name="ghi_chu" defaultValue={initialData?.ghi_chu} rows={3} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background" />
        ) : (
          <div className="px-3 py-2 border rounded-md text-sm bg-muted/30 min-h-[60px] whitespace-pre-wrap text-muted-foreground">{initialData?.ghi_chu || 'Không có ghi chú'}</div>
        )}
      </div>

      <FormFooter isEditMode={isEditMode} isPending={isPending} initialData={initialData} onSuccess={onSuccess} onDelete={handleDelete} />
    </form>
  );
}

// ===================================
// UTILS
// ===================================
function ModalWrapper({ title, isEditMode, setIsEditMode, showToggle, onClose, children }: { title: string, isEditMode: boolean, setIsEditMode: (v: boolean) => void, showToggle: boolean, onClose: () => void, children: React.ReactNode }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      onClick={() => onClose()}
    >
      <div 
        className="bg-background w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/30">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> {title}
          </h2>
          <div className="flex items-center gap-3">
            {showToggle && (
              <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${isEditMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {isEditMode ? 'Đang sửa' : 'Chỉ xem'}
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl p-1 leading-none">&times;</button>
          </div>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormFooter({ isEditMode, isPending, initialData, onSuccess, onDelete }: { isEditMode: boolean, isPending: boolean, initialData: any, onSuccess: () => void, onDelete: () => void }) {
  if (!isEditMode) {
    return (
      <div className="flex justify-end mt-4 pt-4 border-t">
        <button type="button" onClick={onSuccess} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t">
      {initialData ? (
        <button 
          type="button" 
          onClick={onDelete}
          className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Xóa
        </button>
      ) : (
        <div></div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onSuccess} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
          Đóng
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isPending ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Tạo mới')}
        </button>
      </div>
    </div>
  );
}
