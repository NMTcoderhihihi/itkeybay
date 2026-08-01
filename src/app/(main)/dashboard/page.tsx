import React from 'react'
import { getDashboardData } from '@/app/actions/dashboard'
import { DashboardClient } from './dashboard-client'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || session.role !== 'Quan ly') {
    redirect('/kho')
  }

  const data = await getDashboardData()

  return <DashboardClient initialData={data} />
}
