'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';
import { Plus, Package, Pencil, FileText, Calendar, Link as LinkIcon, Filter, Search, Crown, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { PRODUCT_TYPES } from '@/lib/constants';
import { canCreateProduct, getPlanLimits } from '@/lib/plan';
import { DeleteProductButton, TogglePublishButton } from './product-actions';
import type { Product, PlanType } from '@/types';
import { useTranslations } from 'next-intl';

interface ProductsListProps {
  initialProducts: Product[];
  plan: PlanType;
}

export function ProductsList({ initialProducts, plan }: ProductsListProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslations('Products');

  const TYPE_FILTERS = [
    { value: 'all', label: t('filterAll'), icon: Filter },
    { value: 'digital', label: t('filterDigital'), icon: FileText },
    { value: 'booking', label: t('filterBooking'), icon: Calendar },
    { value: 'link', label: t('filterLink'), icon: LinkIcon },
  ];

  const limits = getPlanLimits(plan);
  const canCreate = canCreateProduct(plan, initialProducts.length);
  const isAtLimit = !canCreate && plan === 'free';

  const filteredProducts = useMemo(() => {
    let products = initialProducts;
    
    // Filter by type
    if (activeFilter !== 'all') {
      products = products.filter(p => p.type === activeFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return products;
  }, [initialProducts, activeFilter, searchQuery]);

  // Count products by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialProducts.length };
    initialProducts.forEach(p => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return counts;
  }, [initialProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
            {plan === 'free' && (
              <span className="ml-2 text-xs font-medium text-amber-600">
                {t('itemCount', { current: initialProducts.length, max: limits.max_products })}
              </span>
            )}
          </p>
        </div>
        {canCreate ? (
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('addProduct')}
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/upgrade">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              {t('upgradePro')}
            </Button>
          </Link>
        )}
      </div>

      {/* Limit Warning */}
      {isAtLimit && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">{t('limitTitle', { max: limits.max_products })}</p>
            <p className="text-sm text-amber-700 mt-1">
              {t('limitDesc', { max: limits.max_products })}
            </p>
            <Link href="/dashboard/upgrade" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline">
              <Crown className="h-3.5 w-3.5" />
              {t('upgradeNow')}
            </Link>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(filter => {
            const Icon = filter.icon;
            const count = typeCounts[filter.value] || 0;
            const isActive = activeFilter === filter.value;
            
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive ? 'bg-primary-foreground/20' : 'bg-background'}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {activeFilter === 'all' ? t('noProducts') : t('noProductsInCategory')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeFilter === 'all' ? t('startCreating') : t('trySwitchCategory')}
            </p>
            {canCreate && (
              <Link href="/dashboard/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addProduct')}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function isBookingMeetingComplete(product: Product): boolean {
  if (product.type !== 'booking') return true;
  const config = product.type_config as unknown as Record<string, unknown>;
  const locationType = (config?.location_type as string) || 'online';
  if (locationType === 'online') return !!(config?.meeting_link as string)?.trim();
  return !!(config?.location_address as string)?.trim();
}

function ProductRow({ product }: { product: Product }) {
  const t = useTranslations('Products');
  const typeInfo = PRODUCT_TYPES[product.type as keyof typeof PRODUCT_TYPES] || PRODUCT_TYPES.booking;
  const TYPE_ICONS = {
    all: Filter,
    digital: FileText,
    booking: Calendar,
    link: LinkIcon,
  };
  const TypeIcon = TYPE_ICONS[product.type as keyof typeof TYPE_ICONS] || Package;
  const missingMeetingInfo = !isBookingMeetingComplete(product);

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${missingMeetingInfo ? 'border-amber-300' : ''}`}>
      <div className="flex items-center gap-4 p-4">
        {/* Image */}
        <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{product.title}</h3>
            <Badge variant={product.is_published ? 'success' : 'secondary'} className="flex-shrink-0">
              {product.is_published ? t('published') : t('hidden')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3.5 w-3.5" />
              {typeInfo.label}
            </span>
            {product.description && (
              <span className="truncate max-w-xs hidden sm:inline">
                {product.description}
              </span>
            )}
          </div>
          {/* Warning for incomplete booking products */}
          {missingMeetingInfo && (
            <Link
              href={`/dashboard/products/${product.id}/edit`}
              className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1.5 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {t('bookingMissingMeetingInfo')}
            </Link>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="font-bold text-lg">{formatPrice(product.price)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('edit')}</span>
            </Button>
          </Link>
          <TogglePublishButton product={product} />
          <DeleteProductButton productId={product.id} productTitle={product.title} />
        </div>
      </div>
    </Card>
  );
}
