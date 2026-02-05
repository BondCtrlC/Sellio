'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Star, Send, CheckCircle } from 'lucide-react';
import { createReview } from '@/actions/reviews';

interface ReviewFormProps {
  orderId: string;
  productTitle: string;
  onSuccess?: () => void;
}

export function ReviewForm({ orderId, productTitle, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('กรุณาให้คะแนน');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createReview(orderId, rating, comment);
    
    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด');
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
          <h3 className="font-semibold text-lg mb-2">ขอบคุณสำหรับรีวิว!</h3>
          <p className="text-muted-foreground">
            รีวิวของคุณจะช่วยให้ผู้ซื้อคนอื่นตัดสินใจได้ดีขึ้น
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">รีวิวสินค้า</CardTitle>
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
            <label className="text-sm font-medium">ให้คะแนน *</label>
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
                {rating === 5 && 'ยอดเยี่ยม!'}
                {rating === 4 && 'ดีมาก'}
                {rating === 3 && 'พอใช้'}
                {rating === 2 && 'ต้องปรับปรุง'}
                {rating === 1 && 'ไม่พอใจ'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ความคิดเห็น (ไม่บังคับ)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="แชร์ประสบการณ์ของคุณกับสินค้านี้..."
              className="w-full p-3 border rounded-lg resize-none h-24 text-sm"
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || rating === 0} className="w-full">
            {loading ? (
              'กำลังส่ง...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                ส่งรีวิว
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
