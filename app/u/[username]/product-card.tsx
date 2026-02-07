'use client';

import Link from 'next/link';
import { FileDown, Calendar, Video, ExternalLink, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { DEFAULT_STORE_DESIGN, type StoreDesign } from '@/types';
import { useTranslations } from 'next-intl';

interface Product {
  id: string;
  title: string;
  description: string | null;
  type: 'digital' | 'booking' | 'live' | 'link'; // keep 'live' for backward compatibility
  price: number;
  image_url: string | null;
  type_config: Record<string, unknown> | null;
}

interface ProductCardProps {
  product: Product;
  creatorUsername: string;
  design?: StoreDesign | null;
}

const typeConfigBase = {
  digital: { icon: FileDown, label: 'Digital', buttonKey: 'buyNow' as const, color: 'bg-blue-500' },
  booking: { icon: Calendar, label: 'Booking', buttonKey: 'bookNow' as const, color: 'bg-green-500' },
  live: { icon: Video, label: 'Live', buttonKey: 'signUp' as const, color: 'bg-purple-500' },
  link: { icon: ExternalLink, label: 'Link', buttonKey: 'openLink' as const, color: 'bg-orange-500' },
};

export function ProductCard({ product, creatorUsername, design }: ProductCardProps) {
  const t = useTranslations('StoreFront');
  const config = typeConfigBase[product.type];
  const Icon = config.icon;
  const currentDesign = design || DEFAULT_STORE_DESIGN;

  // For link type, redirect directly to the URL
  const isLink = product.type === 'link';
  const linkUrl = isLink ? (product.type_config?.link_url as string) : null;

  const handleLinkClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Generate card classes based on design
  const getCardClasses = () => {
    const classes: string[] = ['bg-white', 'overflow-hidden', 'transition-shadow', 'hover:shadow-md'];
    
    // Rounded
    const roundedMap: Record<string, string> = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md',
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      '2xl': 'rounded-2xl',
      'full': 'rounded-3xl',
    };
    classes.push(roundedMap[currentDesign.card_rounded] || 'rounded-2xl');
    
    // Shadow
    if (currentDesign.card_style !== 'minimal') {
      const shadowMap: Record<string, string> = {
        'none': '',
        'sm': 'shadow-sm',
        'md': 'shadow-md',
        'lg': 'shadow-lg',
      };
      const shadowClass = shadowMap[currentDesign.card_shadow];
      if (shadowClass) classes.push(shadowClass);
    }
    
    // Border
    if (currentDesign.card_style === 'bordered' || currentDesign.card_style === 'default') {
      classes.push('border');
    }
    
    return classes.join(' ');
  };

  const cardContent = (
    <div className={getCardClasses()}>
      <div className="flex">
        {/* Product Image */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Type Badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${config.color}`}>
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground truncate">
              {product.title}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {product.description}
              </p>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-lg">
              {product.price > 0 ? formatPrice(product.price) : t('free')}
            </span>
            <span className="text-sm font-medium" style={{ color: currentDesign.theme_color }}>
              {t(config.buttonKey)} →
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Link type opens URL directly
  if (isLink && linkUrl) {
    return (
      <div onClick={handleLinkClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  // Other types go to checkout/booking page
  return (
    <Link href={`/u/${creatorUsername}/${product.id}`}>
      {cardContent}
    </Link>
  );
}

// Vertical Product Card (Grid Layout)
export function VerticalProductCard({ product, creatorUsername, design }: ProductCardProps) {
  const t = useTranslations('StoreFront');
  const config = typeConfigBase[product.type];
  const Icon = config.icon;
  const currentDesign = design || DEFAULT_STORE_DESIGN;

  const isLink = product.type === 'link';
  const linkUrl = isLink ? (product.type_config?.link_url as string) : null;

  const handleLinkClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border">
      {/* Product Image */}
      <div className="aspect-square bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground text-sm truncate">
          {product.title}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold">
            {product.price > 0 ? formatPrice(product.price) : t('free')}
          </span>
        </div>

        {/* Action Button */}
        <button 
          className="w-full mt-3 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: currentDesign.theme_color }}
        >
          {t(config.buttonKey)}
        </button>
      </div>
    </div>
  );

  if (isLink && linkUrl) {
    return (
      <div onClick={handleLinkClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/u/${creatorUsername}/${product.id}`}>
      {cardContent}
    </Link>
  );
}

// Compact Product Card (List Layout)
export function CompactProductCard({ product, creatorUsername, design }: ProductCardProps) {
  const t = useTranslations('StoreFront');
  const config = typeConfigBase[product.type];
  const Icon = config.icon;
  const currentDesign = design || DEFAULT_STORE_DESIGN;

  const isLink = product.type === 'link';
  const linkUrl = isLink ? (product.type_config?.link_url as string) : null;

  const handleLinkClick = () => {
    if (linkUrl) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4 flex items-center gap-4 hover:shadow-md transition-shadow border">
      {/* Small Icon/Image */}
      <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${currentDesign.theme_color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: currentDesign.theme_color }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
        <span className="text-sm text-muted-foreground">
          {product.price > 0 ? formatPrice(product.price) : t('free')}
        </span>
      </div>

      {/* Arrow */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${currentDesign.theme_color}15` }}
      >
        <span style={{ color: currentDesign.theme_color }} className="text-lg">→</span>
      </div>
    </div>
  );

  if (isLink && linkUrl) {
    return (
      <div onClick={handleLinkClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/u/${creatorUsername}/${product.id}`}>
      {cardContent}
    </Link>
  );
}
