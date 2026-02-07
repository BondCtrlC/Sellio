'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Star, Send, CheckCircle } from 'lucide-react';
import { createReview } from '@/actions/reviews';
import { useTranslations } from 'next-intl';

interface ReviewFormProps {
  orderId: string;
  productTitle: string;
  onSuccess?: () => void;
}

export function ReviewForm({ orderId, productTitle, onSuccess }: ReviewFormProps) {
  const t = useTranslations('ReviewSection');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError(t('pleaseRate'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await createReview(orderId, rating, comment);
    
    if (!result.success) {
      setError(result.error || t('error'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    onSuccess?.();
  };

  if (success) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">{t('thankYou')}</h3>
          <p className="text-muted-foreground">
            {t('thankYouDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('reviewProduct')}</CardTitle>
        <p className="text-sm text-muted-foreground">{productTitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('rateLabel')}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && t('excellent')}
                {rating === 4 && t('veryGood')}
                {rating === 3 && t('average')}
                {rating === 2 && t('needsImprovement')}
                {rating === 1 && t('unsatisfied')}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('commentLabel')}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('commentFormPlaceholder')}
              className="w-full p-3 border rounded-lg resize-none h-24 text-sm"
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || rating === 0} className="w-full">
            {loading ? (
              t('submitting')
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('submitReview')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
