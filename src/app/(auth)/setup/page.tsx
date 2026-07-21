import { checkNeedsSetup } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import SetupForm from './setup-form'

export default async function SetupPage() {
  const needsSetup = await checkNeedsSetup()
  if (!needsSetup) {
    redirect('/login')
  }

  return <SetupForm />
}
