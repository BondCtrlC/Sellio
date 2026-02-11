'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { X, Search, Package, FileDown, Calendar, Video, ExternalLink, Plus, Check, AlertTriangle } from 'lucide-react';
import { getAllProducts, addProductToStore } from '@/actions/store-layout';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Product, StoreItemWithProduct } from '@/types';

/** Check if a booking/live product has required meeting info */
function isBookingMeetingInfoComplete(product: Product): boolean {
  if (product.type !== 'booking') return true;
  const config = product.type_config as unknown as Record<string, unknown>;
  const locationType = (config?.location_type as string) || 'online';
  if (locationType === 'online') {
    return !!(config?.meeting_link as string)?.trim();
  }
  return !!(config?.location_address as string)?.trim();
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (item: StoreItemWithProduct) => void;
  targetSectionId: string | null;
  existingItemIds: string[];
}

const typeConfig = {
  digital: {
    icon: FileDown,
    label: 'Digital',
    color: 'bg-blue-500',
  },
  booking: {
    icon: Calendar,
    label: 'Booking',
    color: 'bg-green-500',
  },
  live: {
    icon: Video,
    label: 'Live',
    color: 'bg-purple-500',
  },
  link: {
    icon: ExternalLink,
    label: 'Link',
    color: 'bg-orange-500',
  },
};

export function AddProductModal({ isOpen, onClose, onProductAdded, targetSectionId, existingItemIds }: AddProductModalProps) {
  const t = useTranslations('MyStore');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getAllProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    }
    setLoading(false);
  };

  const [addError, setAddError] = useState<string | null>(null);

  const handleAddProduct = async (product: Product) => {
    setAddError(null);
    setAddingId(product.id);
    const result = await addProductToStore(product.id, targetSectionId);
    if (result.success && result.data) {
      onProductAdded({
        ...result.data,
        product,
      });
    } else if (result.error) {
      setAddError(result.error);
    }
    setAddingId(null);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Separate available and already added
  const availableProducts = filteredProducts.filter(p => !existingItemIds.includes(p.id));
  const addedProducts = filteredProducts.filter(p => existingItemIds.includes(p.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('addProduct')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Error Banner */}
        {addError && (
          <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {addError}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('loading')}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('noProducts')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('noProductsHint')}
              </p>
            </div>
          ) : availableProducts.length === 0 && addedProducts.length > 0 ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="text-muted-foreground">{t('allProductsAdded')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Available Products */}
              {availableProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isAdded={false}
                  isAdding={addingId === product.id}
                  onAdd={() => handleAddProduct(product)}
                  missingMeetingInfo={!isBookingMeetingInfoComplete(product)}
                />
              ))}

              {/* Already Added Products */}
              {addedProducts.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground mt-4 mb-2">
                    {t('alreadyInStore')}
                  </div>
                  {addedProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isAdded={true}
                      isAdding={false}
                      onAdd={() => {}}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
  missingMeetingInfo?: boolean;
}

function ProductRow({ product, isAdded, isAdding, onAdd, missingMeetingInfo }: ProductRowProps) {
  const t = useTranslations('MyStore');
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config?.icon || Package;

  return (
    <Card className={`${isAdded ? 'opacity-50' : ''} ${missingMeetingInfo ? 'border-amber-300 bg-amber-50/50' : ''}`}>
      <div className="flex items-center gap-3 p-3">
        {/* Image */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${config?.color || 'bg-gray-500'}`}>
              <Icon className="h-2.5 w-2.5" />
              {config?.label || 'Product'}
            </span>
          </div>
          <p className="font-medium text-sm truncate">{product.title}</p>
          <p className="text-xs text-muted-foreground">
            {product.price > 0 ? formatPrice(product.price) : t('free')}
          </p>
          {/* Warning for incomplete booking products */}
          {missingMeetingInfo && (
            <Link
              href={`/dashboard/products/${product.id}/edit`}
              className="flex items-center gap-1 text-xs text-amber-700 mt-1 hover:underline"
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {t('bookingMissingMeetingInfo')}
            </Link>
          )}
        </div>

        {/* Action */}
        {isAdded ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-4 w-4" />
            {t('added')}
          </span>
        ) : missingMeetingInfo ? (
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="text-xs px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
          >
            {t('setupFirst')}
          </Link>
        ) : (
          <Button
            size="sm"
            onClick={onAdd}
            disabled={isAdding}
          >
            {isAdding ? (
              t('adding')
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                {t('add')}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
