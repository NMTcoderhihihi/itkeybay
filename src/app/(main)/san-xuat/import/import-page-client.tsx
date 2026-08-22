"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { importBulkCongHang } from "@/app/actions/san-xuat"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { FileSpreadsheet, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"

type ParsedJob = {
  ma_cong_hang: string
  don_hang: {
    ma_don_hang: string
    ma_hang: string
    so_luong_san_xuat: number
  }[]
}

export function ImportPageClient({ congDoanList }: { congDoanList: any[] }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [pasteData, setPasteData] = useState("")
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([])
  const [selectedCongDoanIds, setSelectedCongDoanIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  // LocalStorage logic
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("draft_import_cong_hang")
      const savedCongDoan = localStorage.getItem("draft_import_cong_doan")
      
      if (savedData) {
        setPasteData(savedData)
        handleParse(savedData, false) // parse but do not save again
      }
      if (savedCongDoan) {
        setSelectedCongDoanIds(JSON.parse(savedCongDoan))
      } else {
        setSelectedCongDoanIds(congDoanList.map(c => c.id))
      }
    } catch (e) {
      console.error(e)
    }
  }, [congDoanList])

  const saveDraft = (text: string, ids: string[]) => {
    localStorage.setItem("draft_import_cong_hang", text)
    localStorage.setItem("draft_import_cong_doan", JSON.stringify(ids))
  }

  const handleParse = (text: string, save = true) => {
    setPasteData(text)
    setErrorMsg("")
    
    if (save) {
      saveDraft(text, selectedCongDoanIds)
    }

    if (!text.trim()) {
      setParsedJobs([])
      return
    }

    try {
      const rows = text.trim().split('\n')
      const jobsMap = new Map<string, ParsedJob>()

      let lastMaCongHang = ""

      for (let i = 0; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cols = rows[i].split(/\t|,/)
        if (cols[0].toLowerCase().includes("mã") && i === 0) continue
        
        let ma_cong_hang = cols[0]?.trim() || ""
        if (!ma_cong_hang && lastMaCongHang) {
          ma_cong_hang = lastMaCongHang
        }

        const ma_don_hang = cols[1]?.trim() || ""
        const ma_hang = cols[2]?.trim() || ""
        const so_luong = parseInt((cols[3] || "").trim().replace(/,/g, '')) || 0

        if (!ma_cong_hang || !ma_don_hang || !ma_hang) {
          throw new Error(`Dòng ${i + 1} bị thiếu dữ liệu bắt buộc (Mã công hàng, Đơn hàng hoặc Mã hàng).`)
        }

        lastMaCongHang = ma_cong_hang

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

  const handleCheckboxChange = (id: string) => {
    const newIds = selectedCongDoanIds.includes(id) 
      ? selectedCongDoanIds.filter(x => x !== id) 
      : [...selectedCongDoanIds, id]
    
    setSelectedCongDoanIds(newIds)
    saveDraft(pasteData, newIds)
  }

  const selectAllCongDoan = () => {
    const newIds = selectedCongDoanIds.length === congDoanList.length ? [] : congDoanList.map(c => c.id)
    setSelectedCongDoanIds(newIds)
    saveDraft(pasteData, newIds)
  }

  const handleImport = async () => {
    if (parsedJobs.length === 0) return
    if (selectedCongDoanIds.length === 0) {
      toast.error(t("production.errorNoStage"))
      return
    }
    setLoading(true)
    const res = await importBulkCongHang({ congHangList: parsedJobs, congDoanIds: selectedCongDoanIds })
    setLoading(false)

    if (res.success) {
      toast.success(`${t("production.importSuccess")} ${res.count} ${t("dashboard.totalOrders").toLowerCase()}!`)
      localStorage.removeItem("draft_import_cong_hang")
      localStorage.removeItem("draft_import_cong_doan")
      router.push("/san-xuat")
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/san-xuat">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("production.importTitle")}</h1>
        </div>
      </div>

      <div className="bg-muted/10 border rounded-xl p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("production.importStep1")}</label>
          <p className="text-xs text-muted-foreground mb-2">
            <span dangerouslySetInnerHTML={{ __html: t("production.importDesc") }} />
          </p>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t("production.importStep2")}</label>
                <Button variant="outline" size="sm" onClick={selectAllCongDoan} className="h-8 text-xs">
                  {selectedCongDoanIds.length === congDoanList.length ? t("production.deselectAll") : t("production.selectAll")}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 border rounded-lg p-4 bg-background">
                {congDoanList.map((cd) => (
                  <label key={cd.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors border bg-card">
                    <Checkbox 
                      checked={selectedCongDoanIds.includes(cd.id)}
                      onCheckedChange={() => handleCheckboxChange(cd.id)}
                    />
                    <span className="text-sm font-medium line-clamp-1" title={cd.ten_cong_doan}>{cd.ten_cong_doan}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("production.importStep3")} ({parsedJobs.length} {t("dashboard.totalOrders")}):</label>
              <div className="border rounded-md overflow-hidden max-h-[500px] overflow-y-auto bg-background">
                <Table>
                  <TableHeader className="bg-muted/80 sticky top-0 backdrop-blur-sm shadow-sm z-10">
                    <TableRow>
                      <TableHead className="w-[200px]">{t("production.importCodeCol")}</TableHead>
                      <TableHead className="w-[150px]">{t("production.orderCountCol")}</TableHead>
                      <TableHead>{t("production.detailCol")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedJobs.map((job, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-primary align-top">{job.ma_cong_hang}</TableCell>
                        <TableCell className="align-top">
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                            {job.don_hang.length}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {job.don_hang.map((dh, i) => (
                              <div key={i} className="text-muted-foreground flex gap-2">
                                <span className="font-mono text-xs mt-0.5">- {dh.ma_don_hang}</span> 
                                <span>({dh.ma_hang}):</span> 
                                <span className="font-bold text-foreground">{dh.so_luong_san_xuat}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Link href="/san-xuat">
                <Button variant="outline" type="button">{t("production.cancel")}</Button>
              </Link>
              <Button onClick={handleImport} disabled={loading || selectedCongDoanIds.length === 0} size="lg">
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t("production.confirmImport")} ({parsedJobs.length} CH)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
