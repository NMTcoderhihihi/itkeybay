import { getDonTongById, getGiaoDichByDonTong } from "@/app/actions/don-tong"
import { notFound } from "next/navigation"
import { ChiTietDonTongClient } from "./chi-tiet-don-tong"

import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DonTongDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const params = await props.params;
  const donTong = await getDonTongById(params.id)
  
  if (!donTong) {
    notFound()
  }

  const giaoDichList = await getGiaoDichByDonTong(params.id)

  const isManager = session.role === 'Quan ly';

  return <ChiTietDonTongClient donTong={donTong} giaoDichList={giaoDichList} isManager={isManager} />
}
