import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCreatorReviews } from '@/actions/reviews';
import { ReviewsList } from './reviews-list';
import { ProGate } from '@/components/shared/pro-gate';
import type { PlanType } from '@/types';

async function getCreatorPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'free' as PlanType;
  
  const { data: creator } = await supabase
    .from('creators')
    .select('plan')
    .eq('user_id', user.id)
    .single();
  
  return (creator?.plan || 'free') as PlanType;
}

export default async function ReviewsPage() {
  const [result, plan] = await Promise.all([
    getCreatorReviews(),
    getCreatorPlan(),
  ]);
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return (
    <ProGate plan={plan} feature="review_management" message="อัปเกรดเป็น Pro เพื่อจัดการรีวิว ตอบกลับ และเลือก Featured reviews">
      <ReviewsList initialReviews={result.reviews} />
    </ProGate>
  );
}
