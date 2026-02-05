'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Eye, 
  EyeOff, 
  Sparkles, 
  MessageSquare,
  Package,
  Send,
  Filter,
  X
} from 'lucide-react';
import { 
  toggleReviewPublished, 
  toggleReviewFeatured, 
  addReviewResponse,
  type Review 
} from '@/actions/reviews';

interface ReviewsListProps {
  initialReviews: Review[];
}

export function ReviewsList({ initialReviews }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');

  // Get unique products for filter
  const products = useMemo(() => {
    const productMap = new Map<string, { id: string; title: string; image_url: string | null }>();
    reviews.forEach(review => {
      if (review.product_id && review.product?.title) {
        productMap.set(review.product_id, {
          id: review.product_id,
          title: review.product.title,
          image_url: review.product.image_url || null,
        });
      }
    });
    return Array.from(productMap.values());
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesProduct = selectedProduct === 'all' || review.product_id === selectedProduct;
      const matchesRating = selectedRating === 'all' || review.rating === parseInt(selectedRating);
      return matchesProduct && matchesRating;
    });
  }, [reviews, selectedProduct, selectedRating]);

  const handleTogglePublished = async (reviewId: string) => {
    setLoading(reviewId);
    const result = await toggleReviewPublished(reviewId);
    if (result.success) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, is_published: result.is_published! } : r
      ));
    }
    setLoading(null);
  };

  const handleToggleFeatured = async (reviewId: string) => {
    setLoading(reviewId);
    const result = await toggleReviewFeatured(reviewId);
    if (result.success) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, is_featured: result.is_featured! } : r
      ));
    }
    setLoading(null);
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    
    setLoading(reviewId);
    const result = await addReviewResponse(reviewId, responseText);
    if (result.success) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { 
          ...r, 
          response: responseText, 
          response_at: new Date().toISOString() 
        } : r
      ));
      setRespondingTo(null);
      setResponseText('');
    }
    setLoading(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Calculate stats based on filtered reviews
  const totalReviews = filteredReviews.length;
  const averageRating = totalReviews > 0 
    ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0';
  const publishedCount = filteredReviews.filter(r => r.is_published).length;

  const hasActiveFilter = selectedProduct !== 'all' || selectedRating !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">รีวิวจากลูกค้า</h2>
          <p className="text-muted-foreground">จัดการรีวิวสินค้าของคุณ</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">กรอง:</span>
            </div>

            {/* Product Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
              >
                <option value="all">สินค้าทั้งหมด ({reviews.length} รีวิว)</option>
                {products.map(product => {
                  const count = reviews.filter(r => r.product_id === product.id).length;
                  return (
                    <option key={product.id} value={product.id}>
                      {product.title} ({count} รีวิว)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="min-w-[140px]">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
              >
                <option value="all">คะแนนทั้งหมด</option>
                <option value="5">⭐ 5 ดาว</option>
                <option value="4">⭐ 4 ดาว</option>
                <option value="3">⭐ 3 ดาว</option>
                <option value="2">⭐ 2 ดาว</option>
                <option value="1">⭐ 1 ดาว</option>
              </select>
            </div>

            {/* Clear Filter */}
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProduct('all');
                  setSelectedRating('all');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                ล้าง
              </Button>
            )}
          </div>

          {/* Active Filter Info */}
          {hasActiveFilter && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">กำลังแสดง:</span>
              {selectedProduct !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <Package className="h-3 w-3" />
                  {products.find(p => p.id === selectedProduct)?.title}
                </Badge>
              )}
              {selectedRating !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {selectedRating} ดาว
                </Badge>
              )}
              <span className="text-muted-foreground">({filteredReviews.length} รีวิว)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">คะแนนเฉลี่ย</p>
                <p className="text-2xl font-bold">{averageRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รีวิวทั้งหมด</p>
                <p className="text-2xl font-bold">{totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เผยแพร่แล้ว</p>
                <p className="text-2xl font-bold">{publishedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">
              {hasActiveFilter ? 'ไม่พบรีวิวที่ตรงกับเงื่อนไข' : 'ยังไม่มีรีวิว'}
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilter 
                ? 'ลองเปลี่ยนเงื่อนไขการกรอง' 
                : 'เมื่อลูกค้ารีวิวสินค้าจะแสดงที่นี่'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className={!review.is_published ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Product Image */}
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {review.product?.image_url ? (
                        <img 
                          src={review.product.image_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{review.buyer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.product?.title || 'สินค้า'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.is_featured && (
                      <Badge variant="warning" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                    {!review.is_published && (
                      <Badge variant="secondary">ซ่อน</Badge>
                    )}
                  </div>
                </div>

                {/* Rating & Date */}
                <div className="flex items-center gap-3 mb-3">
                  {renderStars(review.rating)}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-foreground mb-4">{review.comment}</p>
                )}

                {/* Creator Response */}
                {review.response && (
                  <div className="bg-muted rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium mb-1">การตอบกลับของคุณ:</p>
                    <p className="text-sm text-muted-foreground">{review.response}</p>
                  </div>
                )}

                {/* Response Form */}
                {respondingTo === review.id && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="เขียนการตอบกลับ..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      onClick={() => handleSubmitResponse(review.id)}
                      disabled={loading === review.id}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setRespondingTo(null);
                        setResponseText('');
                      }}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublished(review.id)}
                    disabled={loading === review.id}
                    title={review.is_published ? 'ซ่อนรีวิว' : 'แสดงรีวิว'}
                  >
                    {review.is_published ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFeatured(review.id)}
                    disabled={loading === review.id}
                    title={review.is_featured ? 'ยกเลิก Featured' : 'ตั้งเป็น Featured'}
                  >
                    <Sparkles className={`h-4 w-4 ${review.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                  {!review.response && respondingTo !== review.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRespondingTo(review.id);
                        setResponseText('');
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      ตอบกลับ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
