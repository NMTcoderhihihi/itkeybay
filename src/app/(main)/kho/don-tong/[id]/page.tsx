import { getDonTongById, getGiaoDichByDonTong } from "@/app/actions/don-tong"
import { notFound } from "next/navigation"
import { ChiTietDonTongClient } from "./chi-tiet-don-tong"

export default async function DonTongDetailPage({ params }: { params: { id: string } }) {
  const donTong = await getDonTongById(params.id)
  
  if (!donTong) {
    notFound()
  }

  const giaoDichList = await getGiaoDichByDonTong(params.id)

  return <ChiTietDonTongClient donTong={donTong} giaoDichList={giaoDichList} />
}
