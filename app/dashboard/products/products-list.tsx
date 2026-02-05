'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Input } from '@/components/ui';
import { Plus, Package, Pencil, FileText, Calendar, Link as LinkIcon, Filter, Search } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { PRODUCT_TYPES } from '@/lib/constants';
import { DeleteProductButton, TogglePublishButton } from './product-actions';
import type { Product } from '@/types';

interface ProductsListProps {
  initialProducts: Product[];
}

const TYPE_FILTERS = [
  { value: 'all', label: 'ทั้งหมด', icon: Filter },
  { value: 'digital', label: 'ดิจิทัล', icon: FileText },
  { value: 'booking', label: 'Booking/Live', icon: Calendar },
  { value: 'link', label: 'Link/URL', icon: LinkIcon },
];

export function ProductsList({ initialProducts }: ProductsListProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Count products by type (treat "live" as "booking")
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialProducts.length };
    initialProducts.forEach(p => {
      const productType = p.type === 'live' ? 'booking' : p.type;
      counts[productType] = (counts[productType] || 0) + 1;
    });
    return counts;
  }, [initialProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">สินค้า</h2>
          <p className="text-muted-foreground">จัดการสินค้าและบริการของคุณ</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสินค้า
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาสินค้า..."
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
              {activeFilter === 'all' ? 'ยังไม่มีสินค้า' : 'ไม่พบสินค้าในหมวดหมู่นี้'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeFilter === 'all' ? 'เริ่มต้นสร้างสินค้าแรกของคุณ' : 'ลองเปลี่ยนหมวดหมู่หรือสร้างสินค้าใหม่'}
            </p>
            <Link href="/dashboard/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้า
              </Button>
            </Link>
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

function ProductRow({ product }: { product: Product }) {
  // Handle legacy "live" type as "booking"
  const displayType = product.type === 'live' ? 'booking' : product.type;
  const typeInfo = PRODUCT_TYPES[displayType as keyof typeof PRODUCT_TYPES] || PRODUCT_TYPES.booking;
  const TypeIcon = TYPE_FILTERS.find(f => f.value === displayType)?.icon || Package;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
              {product.is_published ? 'เผยแพร่' : 'ซ่อน'}
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
              <span className="hidden sm:inline">แก้ไข</span>
            </Button>
          </Link>
          <TogglePublishButton product={product} />
          <DeleteProductButton productId={product.id} productTitle={product.title} />
        </div>
      </div>
    </Card>
  );
}
