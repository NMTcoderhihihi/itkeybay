"use client";

import Link from "next/link";
import { useState, useActionState, useEffect } from "react";
import { saveTaiKhoan, deleteTaiKhoan, saveCongNhan, deleteCongNhan } from "@/app/actions/nhan-su";
import { Plus, Edit2, Trash2, Settings2, Shield, Eye, EyeOff, CheckCircle2, XCircle, HardHat, Phone } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/store/confirm-store";
import { ImageUpload } from "@/components/ui/image-upload";

import { useSearchParams } from "next/navigation";

type NhanSuTab = 'TAI_KHOAN' | 'CONG_NHAN';

export function NhanSuClient({ taiKhoanData, congNhanData, serverTimeMs }: { taiKhoanData: any[], congNhanData: any[], serverTimeMs: number }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'CONG_NHAN' ? 'CONG_NHAN' : 'TAI_KHOAN';
  const [activeTab, setActiveTab] = useState<NhanSuTab>(initialTab);
  const [isTaiKhoanModalOpen, setIsTaiKhoanModalOpen] = useState(false);
  const [editingTaiKhoan, setEditingTaiKhoan] = useState<any>(null);
  const [isCongNhanModalOpen, setIsCongNhanModalOpen] = useState(false);
  const [editingCongNhan, setEditingCongNhan] = useState<any>(null);

  useEffect(() => {
    // Log thời gian từ lúc React mount
    console.log(`[Performance] Máy chủ xử lý DB & Render HTML mất: ${serverTimeMs}ms`);
    console.log('[Performance] Giao diện Client đã mount thành công!');
  }, [serverTimeMs]);

  const handleTabChange = (key: NhanSuTab) => {
    setActiveTab(key);
    window.history.replaceState(null, '', `?tab=${key}`);
  };

  const { showConfirm } = useConfirm();

  // Handlers for Tài khoản
  const handleAddTaiKhoan = () => { setEditingTaiKhoan(null); setIsTaiKhoanModalOpen(true); };
  const handleEditTaiKhoan = (item: any) => { setEditingTaiKhoan(item); setIsTaiKhoanModalOpen(true); };
  const handleDeleteTaiKhoan = (item: any) => {
    showConfirm({
      title: 'Khóa / Xóa Tài khoản?',
      description: `Bạn có chắc muốn xóa tài khoản ${item.ho_ten}? Nếu đã có phiếu giao dịch, tài khoản chỉ bị khóa.`,
      confirmText: 'Xác nhận',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteTaiKhoan(item.id);
        if (res.error) toast.error(res.error);
        else toast.success('Đã xử lý tài khoản thành công');
      }
    });
  };

  // Handlers for Công nhân
  const handleAddCongNhan = () => { setEditingCongNhan(null); setIsCongNhanModalOpen(true); };
  const handleEditCongNhan = (item: any) => { setEditingCongNhan(item); setIsCongNhanModalOpen(true); };
  const handleDeleteCongNhan = (item: any) => {
    showConfirm({
      title: 'Xóa Công nhân?',
      description: `Bạn có chắc muốn xóa công nhân ${item.ho_ten}?`,
      confirmText: 'Xóa ngay',
      variant: 'danger',
      onConfirm: async () => {
        const res = await deleteCongNhan(item.id);
        if (res.error) toast.error(res.error);
        else toast.success('Đã xóa công nhân');
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b hide-scrollbar">
        <button
          onClick={() => handleTabChange('TAI_KHOAN')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'TAI_KHOAN' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" /> Tài khoản Hệ thống
        </button>
        <button
          onClick={() => handleTabChange('CONG_NHAN')}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'CONG_NHAN' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <HardHat className="w-4 h-4" /> Công nhân Sản xuất
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {activeTab === 'TAI_KHOAN' ? (
          <>
            <button
              onClick={handleAddTaiKhoan}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50 transition-all min-h-[140px]"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Thêm Tài khoản</span>
            </button>
            {taiKhoanData.map(item => (
              <TaiKhoanCard key={item.id} item={item} onEdit={() => handleEditTaiKhoan(item)} onDelete={() => handleDeleteTaiKhoan(item)} />
            ))}
          </>
        ) : (
          <>
            <button
              onClick={handleAddCongNhan}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50 transition-all min-h-[140px]"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Thêm Công nhân</span>
            </button>
            {congNhanData.map(item => (
              <CongNhanCard key={item.id} item={item} onEdit={() => handleEditCongNhan(item)} onDelete={() => handleDeleteCongNhan(item)} />
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      {isTaiKhoanModalOpen && (
        <ModalWrapper title={editingTaiKhoan ? 'Sửa Tài khoản' : 'Thêm Tài khoản'} onClose={() => setIsTaiKhoanModalOpen(false)}>
          <TaiKhoanForm initialData={editingTaiKhoan} onSuccess={() => setIsTaiKhoanModalOpen(false)} />
        </ModalWrapper>
      )}

      {isCongNhanModalOpen && (
        <ModalWrapper title={editingCongNhan ? 'Sửa Công nhân' : 'Thêm Công nhân'} onClose={() => setIsCongNhanModalOpen(false)}>
          <CongNhanForm initialData={editingCongNhan} onSuccess={() => setIsCongNhanModalOpen(false)} />
        </ModalWrapper>
      )}
    </div>
  );
}

// ===================================
// TÀI KHOẢN COMPONENTS
// ===================================
function TaiKhoanCard({ item, onEdit, onDelete }: { item: any, onEdit: () => void, onDelete: () => void }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className={`flex flex-col p-4 border rounded-xl bg-card shadow-sm relative overflow-hidden ${!item.dang_hoat_dong ? 'opacity-60 grayscale-[50%]' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
            {item.anh_dai_dien ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.anh_dai_dien} alt={item.ho_ten} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary-foreground font-bold">
                {item.ho_ten.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{item.ho_ten}</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${item.vai_tro === 'Quan ly' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {item.vai_tro}
            </span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span>{item.so_dien_thoai}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-muted px-1.5 rounded">{showPass ? item.mat_khau : '••••••••'}</span>
            <button onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {!item.dang_hoat_dong && (
          <div className="flex items-center gap-1.5 text-destructive mt-1 font-medium">
            <XCircle className="w-4 h-4" /> Đã khóa
          </div>
        )}
      </div>
    </div>
  );
}

function TaiKhoanForm({ initialData, onSuccess }: { initialData: any, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(saveTaiKhoan, null);
  const [avatar, setAvatar] = useState(initialData?.anh_dai_dien || '');

  useEffect(() => {
    if (state?.success) { toast.success('Lưu thành công'); onSuccess(); }
    if (state?.error) { toast.error(state.error); }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="anh_dai_dien" value={avatar} />

      <div className="flex justify-center mb-2">
        <ImageUpload value={avatar} onChange={setAvatar} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Họ Tên</label>
          <input type="text" name="ho_ten" defaultValue={initialData?.ho_ten} required className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">SĐT đăng nhập</label>
          <input type="tel" name="so_dien_thoai" defaultValue={initialData?.so_dien_thoai} required className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Mật khẩu</label>
          <input type="text" name="mat_khau" defaultValue={initialData?.mat_khau} required placeholder="VD: 123456" className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Vai trò</label>
          <select name="vai_tro" defaultValue={initialData?.vai_tro || 'Nhan vien'} className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground">
            <option value="Nhan vien" className="bg-background text-foreground">Nhân viên</option>
            <option value="Quan ly" className="bg-background text-foreground">Quản lý</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input type="checkbox" name="dang_hoat_dong" id="dang_hoat_dong_tk" value="true" defaultChecked={initialData ? initialData.dang_hoat_dong : true} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
        <label htmlFor="dang_hoat_dong_tk" className="text-sm cursor-pointer">Tài khoản đang hoạt động</label>
      </div>

      <ModalFooter isPending={isPending} onCancel={onSuccess} isEdit={!!initialData} />
    </form>
  );
}

// ===================================
// CÔNG NHÂN COMPONENTS
// ===================================
function CongNhanCard({ item, onEdit, onDelete }: { item: any, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="flex flex-col p-4 border rounded-xl bg-card shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex gap-2 items-center">
            <h3 className="font-semibold text-base">{item.ho_ten}</h3>
          </div>
          <span className="text-xs font-mono px-1.5 py-0.5 bg-muted rounded mt-1 inline-block">{item.ma_cong_nhan}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 text-sm">
        {item.vai_tro && (
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{item.vai_tro}</span>
          </div>
        )}
        {item.so_dien_thoai && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{item.so_dien_thoai}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CongNhanForm({ initialData, onSuccess }: { initialData: any, onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(saveCongNhan, null);

  useEffect(() => {
    if (state?.success) { toast.success('Lưu thành công'); onSuccess(); }
    if (state?.error) { toast.error(state.error); }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Mã Công nhân</label>
          <input type="text" name="ma_cong_nhan" defaultValue={initialData?.ma_cong_nhan} required placeholder="VD: CN-001" className="px-3 py-2 border rounded-md text-sm font-mono outline-none focus:border-primary bg-background text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Họ Tên</label>
          <input type="text" name="ho_ten" defaultValue={initialData?.ho_ten} required className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Chuyên môn / Vị trí</label>
          <input type="text" name="vai_tro" defaultValue={initialData?.vai_tro} placeholder="VD: Thợ sơn" className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Số điện thoại</label>
          <input type="tel" name="so_dien_thoai" defaultValue={initialData?.so_dien_thoai} className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Ghi chú</label>
        <textarea name="ghi_chu" defaultValue={initialData?.ghi_chu} rows={2} className="px-3 py-2 border rounded-md text-sm outline-none focus:border-primary bg-background text-foreground" />
      </div>

      <ModalFooter isPending={isPending} onCancel={onSuccess} isEdit={!!initialData} />
    </form>
  );
}

// ===================================
// UTILS
// ===================================
function ModalWrapper({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="bg-background w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/20">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> {title}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg p-1 leading-none">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({ isPending, onCancel, isEdit }: { isPending: boolean, onCancel: () => void, isEdit: boolean }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80">
        Huỷ
      </button>
      <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
        {isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Tạo mới')}
      </button>
    </div>
  );
}
