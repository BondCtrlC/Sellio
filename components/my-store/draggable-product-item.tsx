'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui';
import { GripVertical, Eye, EyeOff, Trash2, MoreVertical, Package, FileDown, Calendar, Video, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { removeProductFromStore, toggleItemVisibility } from '@/actions/store-layout';
import { useState } from 'react';
import type { StoreItemWithProduct } from '@/types';

interface DraggableProductItemProps {
  item: StoreItemWithProduct;
  onRemove: () => void;
  onToggleVisibility: (isVisible: boolean) => void;
  isDragging?: boolean;
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

export function DraggableProductItem({ item, onRemove, onToggleVisibility, isDragging }: DraggableProductItemProps) {
  const t = useTranslations('MyStore');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const product = item.product;
  const config = typeConfig[product.type as keyof typeof typeConfig];
  const Icon = config?.icon || Package;

  const handleRemove = async () => {
    setLoading(true);
    await removeProductFromStore(item.id);
    onRemove();
    setLoading(false);
    setShowMenu(false);
  };

  const handleToggleVisibility = async () => {
    setLoading(true);
    await toggleItemVisibility(item.id, !item.is_visible);
    onToggleVisibility(!item.is_visible);
    setLoading(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg ring-2 ring-primary' : ''} ${!item.is_visible ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Product Image */}
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

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${config?.color || 'bg-gray-500'}`}>
              <Icon className="h-2.5 w-2.5" />
              {config?.label || 'Product'}
            </span>
            {!item.is_visible && (
              <span className="text-[10px] text-muted-foreground">{t('hidden')}</span>
            )}
          </div>
          <p className="font-medium text-sm truncate">{product.title}</p>
          <p className="text-xs text-muted-foreground">
            {product.price > 0 ? formatPrice(product.price) : t('free')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={handleToggleVisibility}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title={item.is_visible ? t('hideProduct') : t('showProduct')}
          >
            {item.is_visible ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                <button
                  onClick={handleRemove}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('removeFromStore')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
