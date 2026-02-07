'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { GripVertical, ChevronDown, ChevronRight, Plus, Pencil, Trash2, X, Check, FolderOpen } from 'lucide-react';
import { DraggableProductItem } from './draggable-product-item';
import { useTranslations } from 'next-intl';
import { deleteSection, updateSection } from '@/actions/store-layout';
import type { StoreSectionWithItems } from '@/types';

interface DraggableSectionProps {
  section: StoreSectionWithItems;
  onAddProduct: () => void;
  onItemRemoved: (itemId: string) => void;
  onItemVisibilityToggled: (itemId: string, isVisible: boolean) => void;
  onSectionDeleted: () => void;
  onSectionUpdated: (title: string) => void;
}

export function DraggableSection({
  section,
  onAddProduct,
  onItemRemoved,
  onItemVisibilityToggled,
  onSectionDeleted,
  onSectionUpdated,
}: DraggableSectionProps) {
  const t = useTranslations('MyStore');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [loading, setLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setLoading(true);
    await updateSection(section.id, editTitle.trim());
    onSectionUpdated(editTitle.trim());
    setIsEditing(false);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDeleteSection'))) return;
    setLoading(true);
    await deleteSection(section.id);
    onSectionDeleted();
    setLoading(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg ring-2 ring-primary opacity-80' : ''}`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Section Icon */}
        <FolderOpen className="h-4 w-4 text-muted-foreground" />

        {/* Title */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditTitle(section.title);
                  setIsEditing(false);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleSave}
              disabled={loading}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setEditTitle(section.title);
                setIsEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className="font-medium text-sm flex-1">{section.title}</span>
            <span className="text-xs text-muted-foreground">
              {t('itemCount', { count: section.items.length })}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {/* Section Content */}
      {isExpanded && (
        <CardContent className="p-3 space-y-2">
          {section.items.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              {t('noProductsInSection')}
            </div>
          ) : (
            <SortableContext
              items={section.items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {section.items.map((item) => (
                <DraggableProductItem
                  key={item.id}
                  item={item}
                  onRemove={() => onItemRemoved(item.id)}
                  onToggleVisibility={(isVisible) => onItemVisibilityToggled(item.id, isVisible)}
                />
              ))}
            </SortableContext>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={onAddProduct}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('addProduct')}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
