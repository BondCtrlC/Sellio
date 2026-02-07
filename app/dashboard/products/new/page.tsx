import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canCreateProduct } from '@/lib/plan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { ProductForm } from '../product-form';
import Link from 'next/link';
import type { PlanType } from '@/types';

export const metadata: Metadata = { title: "เพิ่มสินค้า" };

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('id, plan')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  const plan = (creator.plan || 'free') as PlanType;

  // Check product limit
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  const currentCount = count || 0;

  if (!canCreateProduct(plan, currentCount)) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">เพิ่มสินค้าใหม่</h2>
          <p className="text-muted-foreground">สร้างสินค้าหรือบริการใหม่สำหรับร้านค้าของคุณ</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold">ถึงขีดจำกัดแพลน Free แล้ว</h3>
            <p className="text-muted-foreground">
              แพลน Free สร้างได้สูงสุด {currentCount}/{currentCount} สินค้า<br />
              อัปเกรดเป็น Pro เพื่อสร้างสินค้าไม่จำกัด
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                อัปเกรดเป็น Pro
              </Link>
              <Link
                href="/dashboard/products"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-200 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                กลับหน้าสินค้า
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">เพิ่มสินค้าใหม่</h2>
        <p className="text-muted-foreground">สร้างสินค้าหรือบริการใหม่สำหรับร้านค้าของคุณ</p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
          <span className="font-medium">ข้อมูลสินค้า</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
          <span>อัปโหลด/ตั้งค่า</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</span>
          <span>เสร็จสิ้น</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
          <CardDescription>กรอกรายละเอียดสินค้าของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
