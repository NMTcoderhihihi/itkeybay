"use client"

import { useState, useTransition, useEffect } from "react"
import { NguyenLieu } from "@/app/actions/kho"
import { ChiTietGiaoDich } from "@/app/actions/giao-dich"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, ChevronRight, Loader2, Plus, X, Image as ImageIcon, Camera, Smartphone } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"
import { toast } from "sonner"
import Image from "next/image"
import { useTranslation } from "@/hooks/use-translation"

export function PhieuGiaoDich({ nguyenLieuList }: { nguyenLieuList: any[] }) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [danhMucList, setDanhMucList] = useState<any[]>([])

  // Form Data
  const [loaiGiaoDich, setLoaiGiaoDich] = useState<'NHAP' | 'XUAT' | ''>('')
  const [idDanhMuc, setIdDanhMuc] = useState("")
  const [ghiChu, setGhiChu] = useState("")
  const [chiTiet, setChiTiet] = useState<ChiTietGiaoDich[]>([])
  const [danhSachAnh, setDanhSachAnh] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsMobile(isMobileDevice);

    fetchDanhMuc()
  }, [])

  const fetchDanhMuc = async () => {
    // Lấy fetch từ action (Tôi sẽ bổ sung hàm getDanhSachDanhMuc vào action kho hoặc giao-dich)
    const data = await import("@/app/actions/giao-dich").then(m => m.getDanhSachDanhMuc())
    setDanhMucList(data)
  }

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

  const validateStep1 = () => {
    if (!loaiGiaoDich) return toast.error("Vui lòng chọn loại giao dịch (Nhập/Xuất)")
    if (!idDanhMuc) return toast.error("Vui lòng chọn lý do giao dịch")
    setStep(2)
  }

  const validateStep2 = () => {
    if (chiTiet.length === 0) return toast.error("Vui lòng thêm ít nhất 1 vật tư")
    for (const item of chiTiet) {
      if (!item.id_nguyen_lieu) return toast.error("Vui lòng chọn Vật tư")
      if (!item.ma_quy_cach) return toast.error("Vui lòng chọn Quy cách")
      if (!item.so_luong || item.so_luong <= 0) return toast.error("Số lượng phải lớn hơn 0")
    }
    setStep(3)
  }

  const handleSubmit = async () => {
    if (danhSachAnh.length === 0) {
      if (!confirm("Bạn chưa tải ảnh minh chứng lên. Bạn có chắc muốn tiếp tục không?")) return
    }

    startTransition(async () => {
      const { taoPhieuGiaoDichKho } = await import("@/app/actions/giao-dich")
      const result = await taoPhieuGiaoDichKho({
        id_danh_muc: idDanhMuc,
        loai_giao_dich: loaiGiaoDich as 'NHAP' | 'XUAT',
        ghi_chu: ghiChu,
        danh_sach_anh: danhSachAnh,
        chi_tiet: chiTiet
      })

      if (result.success) {
        toast.success("Tạo phiếu giao dịch thành công!")
        // Reset form
        setStep(1)
        setLoaiGiaoDich('')
        setIdDanhMuc('')
        setGhiChu('')
        setChiTiet([])
        setDanhSachAnh([])
      } else {
        toast.error(result.error || "Có lỗi xảy ra khi lưu phiếu")
      }
    })
  }

  if (!isMobile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:py-24 bg-card rounded-xl border shadow-sm text-center">
        <Smartphone className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-3 text-destructive">{t('inventory.mobileRequired')}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t('inventory.mobileRequiredDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full">
      {/* Stepper Indicator (Left side on desktop, Top on mobile) */}
      <div className="md:w-64 flex-shrink-0">
        <div className="sticky top-20 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`flex items-center gap-3 ${step >= num ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold ${step === num ? 'border-primary bg-primary/10' : step > num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              <span className="font-medium hidden md:inline-block">
                {num === 1 ? t('inventory.transactionStep1') : num === 2 ? t('inventory.transactionStep2') : t('inventory.transactionStep3')}
              </span>
              <ChevronRight className="w-4 h-4 md:hidden ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 bg-card rounded-xl border shadow-sm p-4 md:p-6">
        {/* BƯỚC 1: THÔNG TIN CHUNG */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold">{t('inventory.transactionStep1')}</h2>
              <p className="text-muted-foreground text-sm">{t('inventory.transactionStep1Desc')}</p>
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
                  <Label>Lý do (Danh mục)</Label>
                  <Select value={idDanhMuc} onValueChange={(val) => setIdDanhMuc(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn lý do...">
                        {idDanhMuc ? filteredDanhMuc.find(d => d.id === idDanhMuc)?.ten_danh_muc : "Chọn lý do..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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

              <div className="space-y-2">
                <Label>{t('inventory.note')}</Label>
                <Input value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={validateStep1}>{t('inventory.continue')} <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỌN VẬT TƯ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{t('inventory.transactionStep2')}</h2>
                <p className="text-muted-foreground text-sm">{t('inventory.transactionStep2Desc')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddChiTiet} className="gap-2">
                <Plus className="w-4 h-4" /> {t('inventory.addRow')}
              </Button>
            </div>
            
            <div className="space-y-4">
              {chiTiet.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  {t('inventory.noRows')}
                </div>
              )}

              {chiTiet.map((item, index) => {
                // Lọc ra các quy cách của vật tư đang chọn
                const selectedNguyenLieu = nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)
                const quyCachOptions = selectedNguyenLieu?.danh_sach_quy_cach || []

                return (
                  <Card key={index} className="overflow-hidden">
                    <div className="flex bg-muted/50 p-2 justify-between items-center border-b">
                      <span className="text-sm font-semibold ml-2">{t('inventory.row')} #{index + 1}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleRemoveChiTiet(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('inventory.material')}</Label>
                        <Select value={item.id_nguyen_lieu} onValueChange={(val) => updateChiTiet(index, 'id_nguyen_lieu', val || "")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn...">
                              {item.id_nguyen_lieu ? nguyenLieuList.find(nl => nl.id === item.id_nguyen_lieu)?.ten_nguyen_lieu : "Chọn..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {nguyenLieuList.map(nl => (
                              <SelectItem key={nl.id} value={nl.id}>{nl.ten_nguyen_lieu}</SelectItem>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn...">
                              {item.ma_quy_cach ? quyCachOptions.find((qc: any) => qc.ma_quy_cach === item.ma_quy_cach)?.ten : "Chọn..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {quyCachOptions.map((qc: any) => (
                              <SelectItem key={qc.ma_quy_cach} value={qc.ma_quy_cach}>{qc.ten}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('inventory.quantity')} ({selectedNguyenLieu?.don_vi || '...'})</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.so_luong || ''} 
                          onChange={(e) => updateChiTiet(index, 'so_luong', Number(e.target.value))}
                          placeholder="Nhập SL"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>{t('inventory.back')}</Button>
              <Button onClick={validateStep2}>{t('inventory.continue')} <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: ẢNH MINH CHỨNG VÀ HOÀN TẤT */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold">{t('inventory.transactionStep3')}</h2>
              <p className="text-muted-foreground text-sm">{t('inventory.transactionStep3Desc')}</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  id="camera-upload"
                  className="hidden"
                  onChange={handleCameraCapture}
                  disabled={isUploadingImage}
                />
                <label htmlFor="camera-upload">
                  <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isUploadingImage ? 'bg-muted cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-accent'}`}>
                    {isUploadingImage ? (
                      <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                    )}
                    <span className="text-sm font-medium">
                      {isUploadingImage ? t('inventory.uploading') : t('inventory.openCamera')}
                    </span>
                  </div>
                </label>
              </div>

              {danhSachAnh.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {danhSachAnh.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                      <Image src={url} alt="Minh chứng" fill className="object-contain bg-muted/50 p-1" />
                      <button 
                        type="button"
                        className="absolute top-1 right-1 bg-destructive/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDanhSachAnh(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={isPending}>{t('inventory.back')}</Button>
              <Button onClick={handleSubmit} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('inventory.confirm')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
