'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { toggleProductPublish, deleteProduct } from '@/actions/products';
import type { Product } from '@/types';
import { useTranslations } from 'next-intl';

export function TogglePublishButton({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('Products');

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
      title={product.is_published ? t('hideProduct') : t('publishProduct')}
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
  const t = useTranslations('Products');

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete', { title: productTitle }))) {
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
      title={t('deleteProduct')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
