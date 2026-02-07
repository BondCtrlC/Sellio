import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCreatorReviews } from '@/actions/reviews';
import { ReviewsList } from './reviews-list';
import { getTranslations } from 'next-intl/server';
import { ProGate } from '@/components/shared/pro-gate';
import type { PlanType } from '@/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Reviews');
  return { title: t('metaTitle') };
}

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
  const t = await getTranslations('Reviews');
  const [result, plan] = await Promise.all([
    getCreatorReviews(),
    getCreatorPlan(),
  ]);
  
  if (!result.success && (result as any).errorCode === 'AUTH_REQUIRED') {
    redirect('/login');
  }

  return (
    <ProGate plan={plan} feature="review_management" message={t('proGateMessage')}>
      <ReviewsList initialReviews={result.reviews} />
    </ProGate>
  );
}
