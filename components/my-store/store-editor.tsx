'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Card, CardContent } from '@/components/ui';
import { Plus, Settings, Pencil } from 'lucide-react';
import { DraggableProductItem } from './draggable-product-item';
import { DraggableSection } from './draggable-section';
import { AddProductModal } from './add-product-modal';
import { AddSectionModal } from './add-section-modal';
import { reorderItems, reorderSections } from '@/actions/store-layout';
import type { Creator, StoreSectionWithItems, StoreItemWithProduct } from '@/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface StoreEditorProps {
  creator: Creator;
  sections: StoreSectionWithItems[];
  unsectionedItems: StoreItemWithProduct[];
}

export function StoreEditor({ creator, sections: initialSections, unsectionedItems: initialUnsectioned }: StoreEditorProps) {
  const t = useTranslations('MyStore');
  const [sections, setSections] = useState(initialSections);
  const [unsectionedItems, setUnsectionedItems] = useState(initialUnsectioned);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'item' | 'section' | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find active item or section for overlay
  const findActiveItem = useCallback(() => {
    if (!activeId) return null;
    
    // Check unsectioned items
    const unsectionedItem = unsectionedItems.find(item => item.id === activeId);
    if (unsectionedItem) return unsectionedItem;
    
    // Check sectioned items
    for (const section of sections) {
      const item = section.items.find(item => item.id === activeId);
      if (item) return item;
    }
    
    return null;
  }, [activeId, unsectionedItems, sections]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    // Determine if it's a section or item
    if (id.startsWith('section-')) {
      setActiveType('section');
      setActiveId(id.replace('section-', ''));
    } else {
      setActiveType('item');
      setActiveId(id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    if (activeType === 'section') {
      // Reorder sections
      const oldIndex = sections.findIndex(s => `section-${s.id}` === active.id);
      const newIndex = sections.findIndex(s => `section-${s.id}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        setSections(newSections);
        
        // Update server
        await reorderSections(
          newSections.map((s, index) => ({ id: s.id, sort_order: index }))
        );
      }
    } else {
      // Reorder items
      const activeItem = findActiveItem();
      if (!activeItem) return;

      // Check if moving within unsectioned
      const activeUnsectionedIndex = unsectionedItems.findIndex(i => i.id === active.id);
      const overUnsectionedIndex = unsectionedItems.findIndex(i => i.id === over.id);

      if (activeUnsectionedIndex !== -1 && overUnsectionedIndex !== -1) {
        const newItems = arrayMove(unsectionedItems, activeUnsectionedIndex, overUnsectionedIndex);
        setUnsectionedItems(newItems);
        
        await reorderItems(
          newItems.map((item, index) => ({ 
            id: item.id, 
            sort_order: index,
            section_id: null 
          }))
        );
      } else {
        // Check sections
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const activeIndex = section.items.findIndex(item => item.id === active.id);
          const overIndex = section.items.findIndex(item => item.id === over.id);
          
          if (activeIndex !== -1 && overIndex !== -1) {
            const newItems = arrayMove(section.items, activeIndex, overIndex);
            const newSections = [...sections];
            newSections[i] = { ...section, items: newItems };
            setSections(newSections);
            
            await reorderItems(
              newItems.map((item, index) => ({ 
                id: item.id, 
                sort_order: index,
                section_id: section.id 
              }))
            );
            break;
          }
        }
      }
    }

    setActiveId(null);
    setActiveType(null);
  };

  const handleAddProduct = (sectionId: string | null) => {
    setTargetSectionId(sectionId);
    setShowAddProductModal(true);
  };

  const handleProductAdded = (newItem: StoreItemWithProduct) => {
    if (targetSectionId) {
      setSections(prev => prev.map(section => {
        if (section.id === targetSectionId) {
          return { ...section, items: [...section.items, newItem] };
        }
        return section;
      }));
    } else {
      setUnsectionedItems(prev => [...prev, newItem]);
    }
    setShowAddProductModal(false);
  };

  const handleSectionCreated = (newSection: StoreSectionWithItems) => {
    setSections(prev => [...prev, newSection]);
    setShowAddSectionModal(false);
  };

  const handleItemRemoved = (itemId: string) => {
    setUnsectionedItems(prev => prev.filter(i => i.id !== itemId));
    setSections(prev => prev.map(section => ({
      ...section,
      items: section.items.filter(i => i.id !== itemId)
    })));
  };

  const handleItemVisibilityToggled = (itemId: string, isVisible: boolean) => {
    setUnsectionedItems(prev => prev.map(i => 
      i.id === itemId ? { ...i, is_visible: isVisible } : i
    ));
    setSections(prev => prev.map(section => ({
      ...section,
      items: section.items.map(i => 
        i.id === itemId ? { ...i, is_visible: isVisible } : i
      )
    })));
  };

  const handleSectionDeleted = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setUnsectionedItems(prev => [...prev, ...section.items]);
    }
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleSectionUpdated = (sectionId: string, title: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, title } : s
    ));
  };

  return (
    <div className="space-y-4">
      {/* Profile Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                {creator.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{creator.display_name}</h3>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                {t('editProfile')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Unsectioned Items */}
        <div className="space-y-2">
          <SortableContext
            items={unsectionedItems.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {unsectionedItems.map((item) => (
              <DraggableProductItem
                key={item.id}
                item={item}
                onRemove={() => handleItemRemoved(item.id)}
                onToggleVisibility={(isVisible) => handleItemVisibilityToggled(item.id, isVisible)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Sections */}
        <SortableContext
          items={sections.map(s => `section-${s.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <DraggableSection
              key={section.id}
              section={section}
              onAddProduct={() => handleAddProduct(section.id)}
              onItemRemoved={handleItemRemoved}
              onItemVisibilityToggled={handleItemVisibilityToggled}
              onSectionDeleted={() => handleSectionDeleted(section.id)}
              onSectionUpdated={(title) => handleSectionUpdated(section.id, title)}
            />
          ))}
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeType === 'item' && (
            <div className="opacity-80">
              <DraggableProductItem
                item={findActiveItem()!}
                onRemove={() => {}}
                onToggleVisibility={() => {}}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleAddProduct(null)}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addProduct')}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddSectionModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addSection')}
        </Button>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={handleProductAdded}
        targetSectionId={targetSectionId}
        existingItemIds={[
          ...unsectionedItems.map(i => i.product_id),
          ...sections.flatMap(s => s.items.map(i => i.product_id))
        ]}
      />

      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onSectionCreated={handleSectionCreated}
      />
    </div>
  );
}
