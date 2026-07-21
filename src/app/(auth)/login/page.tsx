import { checkNeedsSetup } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export default async function LoginPage() {
  const needsSetup = await checkNeedsSetup()
  if (needsSetup) {
    redirect('/setup')
  }

  return <LoginForm />
}
