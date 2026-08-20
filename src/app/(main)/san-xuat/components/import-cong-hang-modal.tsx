"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { importBulkCongHang } from "@/app/actions/san-xuat"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"


type ImportCongHangModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  congDoanList: any[]
  onSuccess: () => void
}

type ParsedJob = {
  ma_cong_hang: string
  don_hang: {
    ma_don_hang: string
    ma_hang: string
    so_luong_san_xuat: number
  }[]
}

export function ImportCongHangModal({ open, onOpenChange, congDoanList, onSuccess }: ImportCongHangModalProps) {
  const [pasteData, setPasteData] = useState("")
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([])
  const [selectedCongDoanIds, setSelectedCongDoanIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleParse = (text: string) => {
    setPasteData(text)
    setErrorMsg("")
    if (!text.trim()) {
      setParsedJobs([])
      return
    }

    try {
      const rows = text.trim().split('\n')
      const jobsMap = new Map<string, ParsedJob>()

      for (let i = 0; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(/\t|,/)
        if (cols[0].toLowerCase().includes("mã") && i === 0) continue
        
        if (cols.length < 4) {
          throw new Error(`Dòng ${i + 1} không đủ 4 cột dữ liệu.`)
        }

        const ma_cong_hang = cols[0].trim()
        const ma_don_hang = cols[1].trim()
        const ma_hang = cols[2].trim()
        const so_luong = parseInt(cols[3].trim().replace(/,/g, '')) || 0

        if (!ma_cong_hang || !ma_don_hang || !ma_hang) {
          throw new Error(`Dòng ${i + 1} bị thiếu dữ liệu bắt buộc.`)
        }

        if (!jobsMap.has(ma_cong_hang)) {
          jobsMap.set(ma_cong_hang, { ma_cong_hang, don_hang: [] })
        }
        jobsMap.get(ma_cong_hang)!.don_hang.push({
          ma_don_hang,
          ma_hang,
          so_luong_san_xuat: so_luong
        })
      }
      setParsedJobs(Array.from(jobsMap.values()))
    } catch (err: any) {
      setErrorMsg(err.message)
      setParsedJobs([])
    }
  }

  const handleImport = async () => {
    if (parsedJobs.length === 0) return
    if (selectedCongDoanIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 công đoạn áp dụng chung")
      return
    }
    setLoading(true)
    const res = await importBulkCongHang({ congHangList: parsedJobs, congDoanIds: selectedCongDoanIds })
    setLoading(false)

    if (res.success) {
      toast.success(`Đã import thành công ${res.count} công hàng!`)
      setPasteData("")
      setParsedJobs([])
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Công Hàng Hàng Loạt
          </DialogTitle>
          <DialogDescription>
            Copy dữ liệu từ Excel (4 cột: <strong>Mã Công Hàng | Mã Đơn Hàng | Mã/Tên Hàng | Số lượng</strong>) và dán vào ô bên dưới.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dán (Paste) dữ liệu từ Excel:</label>
            <Textarea 
              className="min-h-[150px] font-mono text-sm whitespace-pre" 
              placeholder={"CH-001\tDH-A\tBàn gỗ\t10"}
              value={pasteData}
              onChange={(e) => handleParse(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          {parsedJobs.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">1. Chọn bộ Công đoạn áp dụng chung:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/20">
                  {congDoanList.map((cd) => (
                    <label key={cd.id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-md hover:bg-muted/50">
                      <Checkbox 
                        checked={selectedCongDoanIds.includes(cd.id)}
                        onCheckedChange={() => setSelectedCongDoanIds(p => p.includes(cd.id) ? p.filter(x => x !== cd.id) : [...p, cd.id])}
                      />
                      <span className="text-sm line-clamp-1">{cd.ten_cong_doan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">2. Xem trước Dữ liệu ({parsedJobs.length} CH):</label>
                <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0">
                      <TableRow><TableHead>Mã Công Hàng</TableHead><TableHead>Chi tiết</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedJobs.map((job, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-primary">{job.ma_cong_hang}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {job.don_hang.map((dh, i) => (
                                <div key={i} className="text-muted-foreground">- {dh.ma_don_hang} ({dh.ma_hang}): <span className="font-bold text-foreground">{dh.so_luong_san_xuat}</span></div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
                <Button onClick={handleImport} disabled={loading || selectedCongDoanIds.length === 0}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận Import
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
