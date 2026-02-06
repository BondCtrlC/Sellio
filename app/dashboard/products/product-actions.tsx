'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { toggleProductPublish, deleteProduct } from '@/actions/products';
import type { Product } from '@/types';

export function TogglePublishButton({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    await toggleProductPublish(product.id, !product.is_published);
    router.refresh();
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      title={product.is_published ? 'ซ่อนสินค้า' : 'เผยแพร่สินค้า'}
    >
      {product.is_published ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}

export function DeleteProductButton({ 
  productId, 
  productTitle 
}: { 
  productId: string; 
  productTitle: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`ต้องการลบ "${productTitle}" ใช่หรือไม่?\n\nหากสินค้านี้มีคำสั่งซื้อแล้ว จะไม่สามารถลบได้`)) {
      return;
    }

    setIsLoading(true);
    const result = await deleteProduct(productId);
    
    if (!result.success && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isLoading}
      className="text-destructive hover:text-destructive"
      title="ลบสินค้า"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
