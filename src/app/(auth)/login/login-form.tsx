"use client"

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Đăng nhập
    </Button>
  )
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, null)

  return (
    <Card className="w-full max-w-md shadow-2xl bg-background/80 backdrop-blur-xl border-white/20 dark:border-white/10">
      <CardHeader className="space-y-3 items-center text-center">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <Factory className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Hệ thống ITKeyBay</CardTitle>
        <CardDescription>Đăng nhập để vào không gian làm việc</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md text-center">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              required 
              placeholder="Nhập số điện thoại..."
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}
