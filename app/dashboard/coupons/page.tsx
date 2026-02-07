import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCoupons } from '@/actions/coupons';
import { CouponsList } from './coupons-list';

export const metadata: Metadata = { title: "คูปอง" };

export default async function CouponsPage() {
  const result = await getCoupons();
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return <CouponsList initialCoupons={result.coupons} />;
}
