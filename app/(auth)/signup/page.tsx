import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { SignupForm } from './signup-form';

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: "สมัคร Sellio ฟรี เริ่มขายสินค้าดิจิทัลผ่านลิงก์เดียวได้ทันที",
};

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">สมัครสมาชิก</CardTitle>
        <CardDescription>
          สร้างบัญชีเพื่อเริ่มต้นขายสินค้าของคุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            เข้าสู่ระบบ
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
