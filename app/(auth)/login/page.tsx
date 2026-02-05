import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
        <CardDescription>
          เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          ยังไม่มีบัญชี?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            สมัครสมาชิก
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
