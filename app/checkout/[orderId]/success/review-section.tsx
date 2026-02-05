'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Star, Send, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { createReview, canReviewOrder } from '@/actions/reviews';

interface ReviewSectionProps {
  orderId: string;
  productTitle: string;
}

export function ReviewSection({ orderId, productTitle }: ReviewSectionProps) {
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const checkReviewStatus = async () => {
      const result = await canReviewOrder(orderId);
      setCanReview(result.canReview);
      setLoading(false);
    };
    checkReviewStatus();
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('กรุณาให้คะแนน');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await createReview(orderId, rating, comment);
    
    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
  };

  if (loading) {
    return null;
  }

  if (!canReview && !success) {
    return null;
  }

  if (success) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="py-6 text-center">
          <CheckCircle className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
          <h4 className="font-semibold text-yellow-800 mb-1">ขอบคุณสำหรับรีวิว!</h4>
          <p className="text-sm text-yellow-700">
            รีวิวของคุณจะช่วยให้ผู้ซื้อคนอื่นตัดสินใจได้ดีขึ้น
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-yellow-200">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            รีวิวสินค้านี้
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">{productTitle}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 hover:scale-110 transition-transform"
                  disabled={submitting}
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {rating === 5 && 'ยอดเยี่ยม!'}
                {rating === 4 && 'ดีมาก'}
                {rating === 3 && 'พอใช้'}
                {rating === 2 && 'ต้องปรับปรุง'}
                {rating === 1 && 'ไม่พอใจ'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="แชร์ประสบการณ์ของคุณ... (ไม่บังคับ)"
              className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
              disabled={submitting}
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || rating === 0}
            className="w-full"
            size="sm"
          >
            {submitting ? (
              'กำลังส่ง...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                ส่งรีวิว
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
