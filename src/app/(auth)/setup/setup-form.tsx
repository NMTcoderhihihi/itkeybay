"use client"

import { useActionState } from 'react'
import { setupFirstAdmin } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button className="w-full" type="submit" variant="default" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Khởi tạo ngay
    </Button>
  )
}

export default function SetupForm() {
  const [state, formAction] = useActionState(setupFirstAdmin, null)

  return (
    <Card className="w-full max-w-md shadow-2xl bg-background/80 backdrop-blur-xl border-white/20 dark:border-white/10">
      <CardHeader className="space-y-3 items-center text-center">
        <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Khởi tạo Hệ thống</CardTitle>
        <CardDescription>Tạo tài khoản Quản lý đầu tiên</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md text-center">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input 
              id="name" 
              name="name" 
              type="text" 
              required 
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              required 
              placeholder="Nhập số điện thoại của bạn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu quản trị</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
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
