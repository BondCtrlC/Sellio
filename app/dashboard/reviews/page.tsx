import { redirect } from 'next/navigation';
import { getCreatorReviews } from '@/actions/reviews';
import { ReviewsList } from './reviews-list';

export default async function ReviewsPage() {
  const result = await getCreatorReviews();
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return <ReviewsList initialReviews={result.reviews} />;
}
