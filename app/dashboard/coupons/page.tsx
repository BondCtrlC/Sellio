import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCoupons } from '@/actions/coupons';
import { CouponsList } from './coupons-list';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Coupons');
  return { title: t('metaTitle') };
}

export default async function CouponsPage() {
  const result = await getCoupons();
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return <CouponsList initialCoupons={result.coupons} />;
}
