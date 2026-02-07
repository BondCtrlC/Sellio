'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { getProductReviews, type Review, type ReviewStats } from '@/actions/reviews';
import { useTranslations } from 'next-intl';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const t = useTranslations('ProductReviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      const result = await getProductReviews(productId);
      if (result.success) {
        setReviews(result.reviews);
        setStats(result.stats);
      }
      setLoading(false);
    };
    loadReviews();
  }, [productId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Bangkok',
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {t('loadingReviews')}
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return null; // Don't show section if no reviews
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        {t('buyerReviews', { count: stats.totalReviews })}
      </h3>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</div>
              {renderStars(Math.round(stats.averageRating), 'md')}
              <p className="text-sm text-muted-foreground mt-1">
                {t('reviewCount', { count: stats.totalReviews })}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {displayedReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {review.buyer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.buyer_name}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {review.is_featured && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    {t('featured')}
                  </span>
                )}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-foreground mt-2">{review.comment}</p>
              )}

              {/* Creator Response */}
              {review.response && (
                <div className="mt-3 pl-4 border-l-2 border-primary/30">
                  <p className="text-xs font-medium text-primary mb-1">{t('sellerResponse')}</p>
                  <p className="text-sm text-muted-foreground">{review.response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show More/Less */}
      {reviews.length > 3 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              {t('showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              {t('showAll', { count: reviews.length })}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ============================================
// Star Rating Input Component
// ============================================
interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={`h-8 w-8 ${
              star <= (hoverValue || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
