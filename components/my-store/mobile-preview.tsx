'use client';

import { MobileFrame } from './mobile-frame';
import { FileDown, Calendar, Video, ExternalLink, Package, Instagram, Phone, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { DEFAULT_STORE_DESIGN } from '@/types';
import type { Creator, StoreSectionWithItems, StoreItemWithProduct, StoreDesign } from '@/types';

interface MobilePreviewProps {
  creator: Creator;
  sections: StoreSectionWithItems[];
  unsectionedItems: StoreItemWithProduct[];
  design?: StoreDesign;
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

// Custom Line icon
function LineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );
}

export function MobilePreview({ creator, sections, unsectionedItems, design }: MobilePreviewProps) {
  const currentDesign = design || creator.store_design || DEFAULT_STORE_DESIGN;
  
  // Build contact links
  const contactLinks: { icon: React.ComponentType<{ className?: string }> }[] = [];
  if (creator.contact_ig) contactLinks.push({ icon: Instagram });
  if (creator.contact_line) contactLinks.push({ icon: LineIcon });
  if (creator.contact_email) contactLinks.push({ icon: Mail });
  if (creator.contact_phone) contactLinks.push({ icon: Phone });

  // Generate background style
  const backgroundStyle = currentDesign.background_type === 'gradient'
    ? { background: `linear-gradient(to bottom, ${currentDesign.background_gradient_from}, ${currentDesign.background_gradient_to})` }
    : { backgroundColor: currentDesign.background_color };

  // Avatar size classes
  const avatarSizeMap = {
    sm: 'w-14 h-14 text-lg',
    md: 'w-18 h-18 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };
  const avatarSize = avatarSizeMap[currentDesign.avatar_size || 'lg'];

  // Layout settings
  const profileLayout = currentDesign.profile_layout || 'centered';
  const productLayout = currentDesign.product_layout || 'horizontal';

  // Font class mapping
  const fontClassMap: Record<string, string> = {
    default: 'font-default',
    sarabun: 'font-sarabun',
    prompt: 'font-prompt',
    noto: 'font-noto',
    ibm: 'font-ibm',
    pridi: 'font-pridi',
  };
  const fontClass = fontClassMap[currentDesign.font_family || 'default'] || 'font-default';

  return (
    <MobileFrame>
      <div className={`min-h-full ${fontClass}`} style={backgroundStyle}>
        {/* Hero Layout - Avatar as background */}
        {profileLayout === 'hero' && (
          <div className="relative h-48">
            {/* Background Image */}
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{ backgroundColor: currentDesign.theme_color }}
              />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
              <h1 className="text-xl font-bold text-center drop-shadow-lg">{creator.display_name}</h1>
              {creator.bio && (
                <p className="text-sm text-center text-white/90 mt-1 line-clamp-2 drop-shadow">
                  {creator.bio}
                </p>
              )}
              {/* Contact Icons */}
              {contactLinks.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {contactLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Header for non-hero layouts */}
        {profileLayout !== 'hero' && (
          <div className={`px-4 ${
            profileLayout === 'with_cover' ? '-mt-10 pb-4' :
            profileLayout === 'minimal' ? 'pt-4 pb-3' : 'text-center pt-8 pb-6'
          }`}>
            {/* Cover for with_cover layout */}
            {profileLayout === 'with_cover' && (
              <div 
                className="h-20 w-full absolute top-0 left-0 right-0"
                style={{ backgroundColor: currentDesign.theme_color }}
              />
            )}
            
            {profileLayout === 'minimal' ? (
              // Minimal Layout - Horizontal
              <div className="flex items-center gap-3">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.display_name}
                    className={`${avatarSize} rounded-full object-cover border-2 border-white shadow`}
                  />
                ) : (
                  <div 
                    className={`${avatarSize} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
                    style={{ backgroundColor: currentDesign.theme_color }}
                  >
                    {creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold truncate">{creator.display_name}</h1>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                  {contactLinks.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {contactLinks.map((link, index) => {
                        const Icon = link.icon;
                        return (
                          <div key={index} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Centered or With Cover Layout
              <>
                {/* Avatar */}
                <div className={profileLayout === 'with_cover' ? 'flex justify-center relative z-10' : ''}>
                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      className={`${avatarSize} rounded-full mx-auto mb-3 object-cover ${
                        profileLayout === 'with_cover' ? 'border-4 border-white shadow-lg' : ''
                      }`}
                    />
                  ) : (
                    <div 
                      className={`${avatarSize} rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold ${
                        profileLayout === 'with_cover' ? 'border-4 border-white shadow-lg' : ''
                      }`}
                      style={{ backgroundColor: currentDesign.theme_color }}
                    >
                      {creator.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Name */}
                <h1 className="text-lg font-bold text-center">{creator.display_name}</h1>
                <p className="text-sm text-muted-foreground text-center">@{creator.username}</p>
                
                {/* Bio */}
                {creator.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 text-center">
                    {creator.bio}
                  </p>
                )}

                {/* Contact Icons */}
                {contactLinks.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {contactLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Products */}
        <div className="px-3 pb-6">
          {/* Unsectioned Items */}
          <ProductList 
            items={unsectionedItems.filter(item => item.is_visible)} 
            productLayout={productLayout}
            design={currentDesign}
          />

          {/* Sections */}
          {sections.map((section) => {
            const visibleItems = section.items.filter(item => item.is_visible);
            if (!section.is_visible || visibleItems.length === 0) return null;
            
            return (
              <div key={section.id} className="mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                  {section.title}
                </h3>
                <ProductList 
                  items={visibleItems} 
                  productLayout={productLayout}
                  design={currentDesign}
                />
              </div>
            );
          })}

          {/* Empty State */}
          {unsectionedItems.filter(item => item.is_visible).length === 0 && 
           sections.every(s => s.items.filter(i => i.is_visible).length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              ยังไม่มีสินค้าในร้าน
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t">
          Powered by Sellio
        </div>
      </div>
    </MobileFrame>
  );
}

// Product List Component - renders based on layout
function ProductList({ items, productLayout, design }: { 
  items: StoreItemWithProduct[]; 
  productLayout: string;
  design: StoreDesign;
}) {
  if (items.length === 0) return null;

  if (productLayout === 'vertical') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <VerticalProductCard key={item.id} item={item} design={design} />
        ))}
      </div>
    );
  }

  if (productLayout === 'compact') {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <CompactProductCard key={item.id} item={item} design={design} />
        ))}
      </div>
    );
  }

  // Default: horizontal
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <HorizontalProductCard key={item.id} item={item} design={design} />
      ))}
    </div>
  );
}

// Horizontal Product Card (default)
function HorizontalProductCard({ item, design }: { item: StoreItemWithProduct; design: StoreDesign }) {
  const product = item.product;
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config?.icon || Package;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0 bg-muted">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 p-2 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-white ${config?.color || 'bg-gray-500'}`}>
              <Icon className="h-2.5 w-2.5" />
              {config?.label || 'Product'}
            </span>
          </div>
          <h3 className="text-xs font-semibold truncate">{product.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold">
              {product.price > 0 ? formatPrice(product.price) : 'ฟรี'}
            </span>
            <span className="text-[10px] font-medium" style={{ color: design.theme_color }}>
              ดูเพิ่มเติม →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Vertical Product Card (grid layout)
function VerticalProductCard({ item, design }: { item: StoreItemWithProduct; design: StoreDesign }) {
  const product = item.product;
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config?.icon || Package;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-2">
        <div className="flex items-center gap-1 mb-1">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] text-white ${config?.color || 'bg-gray-500'}`}>
            <Icon className="h-2 w-2" />
            {config?.label || 'Product'}
          </span>
        </div>
        <h3 className="text-[10px] font-semibold truncate">{product.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-bold">
            {product.price > 0 ? formatPrice(product.price) : 'ฟรี'}
          </span>
        </div>
        {/* Action Button */}
        <button 
          className="w-full mt-2 py-1 rounded-lg text-[10px] font-medium text-white"
          style={{ backgroundColor: design.theme_color }}
        >
          ดูเพิ่มเติม
        </button>
      </div>
    </div>
  );
}

// Compact Product Card (minimal list)
function CompactProductCard({ item, design }: { item: StoreItemWithProduct; design: StoreDesign }) {
  const product = item.product;
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config?.icon || Package;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-3 flex items-center gap-3">
      {/* Small Icon/Image */}
      <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${design.theme_color}20` }}>
            <Icon className="h-5 w-5" style={{ color: design.theme_color }} />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold truncate">{product.title}</h3>
        <span className="text-[10px] text-muted-foreground">
          {product.price > 0 ? formatPrice(product.price) : 'ฟรี'}
        </span>
      </div>
      {/* Arrow */}
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${design.theme_color}15` }}
      >
        <span style={{ color: design.theme_color }} className="text-xs">→</span>
      </div>
    </div>
  );
}
