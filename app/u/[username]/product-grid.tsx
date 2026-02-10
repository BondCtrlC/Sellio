'use client';

import { ProductCard, VerticalProductCard, CompactProductCard } from './product-card';
import { DEFAULT_STORE_DESIGN, type StoreDesign } from '@/types';

interface Product {
  id: string;
  title: string;
  description: string | null;
  type: 'digital' | 'booking' | 'live' | 'link'; // keep 'live' for backward compatibility
  price: number;
  image_url: string | null;
  type_config: Record<string, unknown> | null;
}

interface ProductGridProps {
  products: Product[];
  creatorUsername: string;
  design?: StoreDesign | null;
}

export function ProductGrid({ products, creatorUsername, design }: ProductGridProps) {
  const currentDesign = design || DEFAULT_STORE_DESIGN;
  const productLayout = currentDesign.product_layout || 'horizontal';

  // Vertical (Grid) Layout
  if (productLayout === 'vertical') {
    return (
      <div className="grid grid-cols-2 gap-6">
        {products.map((product) => (
          <VerticalProductCard 
            key={product.id} 
            product={product} 
            creatorUsername={creatorUsername}
            design={currentDesign}
          />
        ))}
      </div>
    );
  }

  // Compact (List) Layout
  if (productLayout === 'compact') {
    return (
      <div className="space-y-6">
        {products.map((product) => (
          <CompactProductCard 
            key={product.id} 
            product={product} 
            creatorUsername={creatorUsername}
            design={currentDesign}
          />
        ))}
      </div>
    );
  }

  // Default: Horizontal Layout
  return (
    <div className="space-y-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          creatorUsername={creatorUsername}
          design={currentDesign}
        />
      ))}
    </div>
  );
}
