"use client"

import { useState, useTransition, useEffect } from "react"
import { NguyenLieu } from "@/app/actions/kho"
import { ChiTietGiaoDich } from "@/app/actions/giao-dich"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Loader2, Plus, X, Image as ImageIcon, Camera } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

export function PhieuGiaoDich({ nguyenLieuList, congHangList, initialDanhMucList = [] }: { nguyenLieuList: any[], congHangList?: any[], initialDanhMucList?: any[] }) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [danhMucList, setDanhMucList] = useState<any[]>(initialDanhMucList)

  // Form Data
  const [loaiGiaoDich, setLoaiGiaoDich] = useState<'NHAP' | 'XUAT' | ''>('')
  const [idDanhMuc, setIdDanhMuc] = useState("")
  const [idCongHang, setIdCongHang] = useState("")
  const [ghiChu, setGhiChu] = useState("")
  const [chiTiet, setChiTiet] = useState<ChiTietGiaoDich[]>([])
  const [danhSachAnh, setDanhSachAnh] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(isMobileDevice);
  }, [])

  useEffect(() => {
    setDanhMucList(initialDanhMucList)
  }, [initialDanhMucList])

  const filteredDanhMuc = danhMucList.filter(dm => dm.phan_he === 'NGUYEN_LIEU' && dm.loai_giao_dich === loaiGiaoDich)

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) throw new Error('Chưa cấu hình Cloudinary');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Ảnh ${file.name} quá lớn (tối đa 10MB)`);
          continue;
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
          setDanhSachAnh(prev => [...prev, data.secure_url]);
        } else {
          toast.error(`Lỗi khi tải ảnh ${file.name}`);
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Lỗi kết nối khi tải ảnh lên');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddChiTiet = () => {
    setChiTiet([...chiTiet, { id_nguyen_lieu: "", ma_quy_cach: "", so_luong: 0 }])
  }

  const handleRemoveChiTiet = (index: number) => {
    const newChiTiet = [...chiTiet]
    newChiTiet.splice(index, 1)
    setChiTiet(newChiTiet)
  }

  const updateChiTiet = (index: number, field: keyof ChiTietGiaoDich, value: any) => {
    const newChiTiet = [...chiTiet]
    newChiTiet[index] = { ...newChiTiet[index], [field]: value }
    
    // Tự động reset quy cách nếu đổi nguyên liệu
    if (field === 'id_nguyen_lieu') {
      newChiTiet[index].ma_quy_cach = ""
    }
    
    setChiTiet(newChiTiet)
  }

  const handleRemoveImage = async (index: number) => {
    const urlToRemove = danhSachAnh[index];
    setDanhSachAnh(prev => prev.filter((_, i) => i !== index));
    try {
      await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove })
      });
    } catch (e) {
      console.error('Failed to cleanup cloudinary image:', e);
    }
  }

  // Validate Tồn kho tức thời (Inline)
  const checkStockError = (item: ChiTietGiaoDich) => {
    if (loaiGiaoDich !== 'XUAT' || !item.id_nguyen_lieu || !item.ma_quy_cach || !item.so_luong) return null;
    const selectedNL = nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)
    const qc = selectedNL?.danh_sach_quy_cach?.find((q: any) => q.ma_quy_cach === item.ma_quy_cach)
    const currentStock = qc?.ton_kho ?? 0
    if (item.so_luong > currentStock) {
      return `Tồn kho không đủ (chỉ còn ${currentStock})`
    }
    return null;
  }

  const hasAnyStockError = chiTiet.some(item => checkStockError(item) !== null);

  const handleSubmit = async () => {
    if (!loaiGiaoDich) return toast.error("Vui lòng chọn loại giao dịch (Nhập/Xuất)")
    if (!idDanhMuc) return toast.error("Vui lòng chọn lý do giao dịch")
    
    if (chiTiet.length === 0) return toast.error("Vui lòng thêm ít nhất 1 vật tư")
    for (const item of chiTiet) {
      if (!item.id_nguyen_lieu) return toast.error("Vui lòng chọn Vật tư")
      if (!item.ma_quy_cach) return toast.error("Vui lòng chọn Quy cách")
      if (!item.so_luong || item.so_luong <= 0) return toast.error("Số lượng phải lớn hơn 0")
    }

    if (hasAnyStockError) {
      toast.error("Vui lòng sửa các lỗi vượt quá tồn kho trước khi lưu!")
      return
    }

    if (danhSachAnh.length === 0) {
      toast.error("Bắt buộc phải có ảnh minh chứng để ghi nhận giao dịch!")
      return
    }

    startTransition(async () => {
      const { taoPhieuGiaoDichKho } = await import("@/app/actions/giao-dich")
      const result = await taoPhieuGiaoDichKho({
        id_danh_muc: idDanhMuc,
        id_cong_hang: idCongHang,
        loai_giao_dich: loaiGiaoDich as 'NHAP' | 'XUAT',
        ghi_chu: ghiChu,
        danh_sach_anh: danhSachAnh,
        chi_tiet: chiTiet
      })

      if (result.success) {
        toast.success(t(""))
        // Reset form
        setLoaiGiaoDich('')
        setIdDanhMuc('')
        setGhiChu('')
        setChiTiet([])
        setDanhSachAnh([])
        
        // Cuộn lên đầu trang sau khi hoàn tất
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi lưu phiếu")
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-24">
      <div className="flex flex-col space-y-6">
        
        {/* PHẦN 1: THÔNG TIN CHUNG */}
        <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
              {t('inventory.transactionStep1')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{t('inventory.transactionStep1Desc')}</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('inventory.type')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="button"
                  variant={loaiGiaoDich === 'NHAP' ? "default" : "outline"} 
                  onClick={() => { setLoaiGiaoDich('NHAP'); setIdDanhMuc('') }}
                  className="h-12"
                >
                  {t('inventory.import')}
                </Button>
                <Button 
                  type="button"
                  variant={loaiGiaoDich === 'XUAT' ? "default" : "outline"} 
                  onClick={() => { setLoaiGiaoDich('XUAT'); setIdDanhMuc('') }}
                  className="h-12"
                >
                  {t('inventory.export')}
                </Button>
              </div>
            </div>

            {loaiGiaoDich && (
              <div className="space-y-2 animate-in fade-in">
                <Label>{t("")}</Label>
                <Select value={idDanhMuc} onValueChange={(val) => setIdDanhMuc(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("")}>
                      {idDanhMuc ? filteredDanhMuc.find(d => d.id === idDanhMuc)?.ten_danh_muc : t("")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)] max-h-[300px] max-w-[90vw]">
                    {filteredDanhMuc.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">Chưa có danh mục nào cho loại này. (Hãy cấu hình ở module Cài đặt Danh mục)</div>
                    ) : (
                      filteredDanhMuc.map(dm => (
                        <SelectItem key={dm.id} value={dm.id}>{dm.ten_danh_muc}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {loaiGiaoDich === 'XUAT' && (
              <div className="space-y-2 animate-in fade-in">
                <Label>{t("")}</Label>
                <Select value={idCongHang} onValueChange={(val) => setIdCongHang(val === "none" ? "" : (val || ""))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn công hàng...">
                      {idCongHang ? congHangList?.find(c => c.id === idCongHang)?.ma_cong_hang : t("")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)] max-h-[300px] max-w-[90vw]">
                    <SelectItem value="none">-- Không áp dụng --</SelectItem>
                    {congHangList?.filter(c => c.trang_thai_sx !== 'DA_LAM').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.ma_cong_hang} ({c.trang_thai_sx === 'DANG_LAM' ? 'Đang SX' : 'Chưa SX'})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('inventory.note')}</Label>
              <Input value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
            </div>
          </div>
        </div>

        {/* PHẦN 2: CHỌN VẬT TƯ */}
        <div className={`bg-card rounded-xl border shadow-sm p-4 md:p-6 space-y-6 transition-opacity duration-300 ${(!loaiGiaoDich || !idDanhMuc) ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                {t('inventory.transactionStep2')}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t('inventory.transactionStep2Desc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddChiTiet} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('inventory.addRow')}</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {chiTiet.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                {t('inventory.noRows')}
              </div>
            )}

            {chiTiet.map((item, index) => {
              const selectedNguyenLieu = nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)
              const quyCachOptions = selectedNguyenLieu?.danh_sach_quy_cach || []
              const errorMsg = checkStockError(item)

              return (
                <Card key={index} className={`overflow-hidden transition-all border ${errorMsg ? 'border-destructive shadow-sm' : ''}`}>
                  <div className={`flex p-2 justify-between items-center border-b ${errorMsg ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
                    <span className={`text-sm font-semibold ml-2 ${errorMsg ? 'text-destructive' : ''}`}>{t('inventory.row')} #{index + 1}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20" onClick={() => handleRemoveChiTiet(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('inventory.material')}</Label>
                      <Select value={item.id_nguyen_lieu} onValueChange={(val) => updateChiTiet(index, 'id_nguyen_lieu', val || "")}>
                        <SelectTrigger className={errorMsg && !item.id_nguyen_lieu ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Chọn...">
                            {item.id_nguyen_lieu ? (() => {
                              const nl = nguyenLieuList.find(n => n.id === item.id_nguyen_lieu);
                              if (!nl) return "Chọn...";
                              return (
                                <div className="flex items-center gap-2">
                                  {nl.anh_minh_hoa ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={nl.anh_minh_hoa} alt={nl.ten_nguyen_lieu} className="w-5 h-5 rounded-full object-cover shrink-0 border" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {nl.ten_nguyen_lieu.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="truncate">{nl.ten_nguyen_lieu}</span>
                                </div>
                              );
                            })() : "Chọn..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)] max-h-[300px] max-w-[90vw]">
                          {nguyenLieuList.map(nl => (
                            <SelectItem key={nl.id} value={nl.id}>
                              <div className="flex items-center gap-2">
                                {nl.anh_minh_hoa ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={nl.anh_minh_hoa} alt={nl.ten_nguyen_lieu} className="w-6 h-6 rounded-full object-cover shrink-0 border shadow-xs" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {nl.ten_nguyen_lieu.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="font-medium">{nl.ten_nguyen_lieu}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('inventory.spec')}</Label>
                      <Select 
                        value={item.ma_quy_cach} 
                        onValueChange={(val) => updateChiTiet(index, 'ma_quy_cach', val || "")}
                        disabled={!item.id_nguyen_lieu}
                      >
                        <SelectTrigger className={errorMsg && !item.ma_quy_cach ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Chọn...">
                            {item.ma_quy_cach ? quyCachOptions.find((qc: any) => qc.ma_quy_cach === item.ma_quy_cach)?.ten : "Chọn..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-auto min-w-[var(--radix-select-trigger-width)] max-h-[300px] max-w-[90vw]">
                          {quyCachOptions.map((qc: any) => (
                            <SelectItem key={qc.ma_quy_cach} value={qc.ma_quy_cach}>
                              <span>{qc.ten}</span>
                              <span className="text-xs font-semibold text-muted-foreground ml-2">
                                (Tồn: {qc.ton_kho ?? 0})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className={`text-xs ${errorMsg ? 'text-destructive font-semibold' : ''}`}>
                        {t('inventory.quantity')} ({selectedNguyenLieu?.don_vi || '...'})
                      </Label>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={item.so_luong || ''} 
                        onChange={(e) => updateChiTiet(index, 'so_luong', Number(e.target.value))}
                        placeholder="Nhập SL"
                        className={errorMsg ? 'border-destructive focus-visible:ring-destructive/50' : ''}
                      />
                      {errorMsg && (
                        <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                          {errorMsg}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* PHẦN 3: ẢNH MINH CHỨNG VÀ HOÀN TẤT */}
        <div className={`bg-card rounded-xl border shadow-sm p-4 md:p-6 space-y-6 transition-opacity duration-300 ${(chiTiet.length === 0) ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
              {t('inventory.transactionStep3')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{t('inventory.transactionStep3Desc')}</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              {isMobile ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="camera-capture-direct"
                      className="hidden"
                      onChange={handleCameraCapture}
                      disabled={isUploadingImage}
                    />
                    <label htmlFor="camera-capture-direct">
                      <div className={`h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isUploadingImage ? 'bg-muted cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-accent border-primary/40 bg-primary/5'}`}>
                        {isUploadingImage ? (
                          <Loader2 className="w-6 h-6 text-muted-foreground mb-1.5 animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-primary mb-1.5" />
                        )}
                        <span className="text-xs font-semibold text-center px-1">Chụp ảnh trực tiếp</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="library-upload-mobile"
                      className="hidden"
                      onChange={handleCameraCapture}
                      disabled={isUploadingImage}
                    />
                    <label htmlFor="library-upload-mobile">
                      <div className={`h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isUploadingImage ? 'bg-muted cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-accent border-muted-foreground/30'}`}>
                        {isUploadingImage ? (
                          <Loader2 className="w-6 h-6 text-muted-foreground mb-1.5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1.5" />
                        )}
                        <span className="text-xs font-semibold text-center px-1">Chọn từ thư viện</span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="pc-file-upload"
                    className="hidden"
                    onChange={handleCameraCapture}
                    disabled={isUploadingImage}
                  />
                  <label htmlFor="pc-file-upload">
                    <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isUploadingImage ? 'bg-muted cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-accent border-primary/40 bg-primary/5'}`}>
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-primary mb-2" />
                      )}
                      <span className="text-sm font-semibold">Chọn ảnh từ máy tính (PC)</span>
                      <span className="text-xs text-muted-foreground mt-1">Hỗ trợ chọn nhiều file JPG, PNG...</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {danhSachAnh.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {danhSachAnh.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                    <Image src={url} alt="Minh chứng" fill className="object-contain bg-muted/50 p-1" />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full shadow-md hover:scale-105 transition-all"
                      onClick={() => handleRemoveImage(i)}
                      title="Xóa ảnh này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NÚT HOÀN TẤT GIAO DỊCH (Ghim cứng dưới đáy) */}
        <div className="pt-4 pb-4 flex justify-end sticky bottom-4 z-40 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-lg mt-8">
          <Button 
            onClick={handleSubmit} 
            disabled={isPending || isUploadingImage || hasAnyStockError} 
            className="w-full md:w-auto h-12 md:h-12 px-10 text-base shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending || isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isUploadingImage ? "Đang xử lý ảnh..." : t("")}
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {t('inventory.confirm')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
