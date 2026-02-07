'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { StoreSection, StoreItem, StoreItemWithProduct, StoreSectionWithItems, StoreLayoutData, Product, Creator, StoreDesign } from '@/types';

export type StoreLayoutResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ============================================
// HELPER: Get Creator ID
// ============================================
async function getCreatorId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return creator?.id || null;
}

// ============================================
// GET: Full Store Layout
// ============================================
export async function getStoreLayout(): Promise<StoreLayoutResult<StoreLayoutData>> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get creator info
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('*')
    .eq('id', creatorId)
    .single();

  if (creatorError || !creator) {
    return { success: false, error: t('creatorNotFound') };
  }

  // Get sections with items
  const { data: sections, error: sectionsError } = await supabase
    .from('store_sections')
    .select('*')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: true });

  if (sectionsError) {
    return { success: false, error: t('cannotLoadSections') };
  }

  // Get all store items with product details
  const { data: items, error: itemsError } = await supabase
    .from('store_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    return { success: false, error: t('cannotLoadProducts') };
  }

  // Organize items by sections
  const sectionsWithItems: StoreSectionWithItems[] = (sections || []).map((section: StoreSection) => ({
    ...section,
    items: (items || [])
      .filter((item: StoreItemWithProduct) => item.section_id === section.id)
      .map((item: { product: Product } & StoreItem) => ({
        ...item,
        product: item.product,
      })) as StoreItemWithProduct[],
  }));

  // Get unsectioned items
  const unsectionedItems: StoreItemWithProduct[] = (items || [])
    .filter((item: StoreItemWithProduct) => item.section_id === null)
    .map((item: { product: Product } & StoreItem) => ({
      ...item,
      product: item.product,
    })) as StoreItemWithProduct[];

  return {
    success: true,
    data: {
      creator: creator as Creator,
      sections: sectionsWithItems,
      unsectionedItems,
    },
  };
}

// ============================================
// GET: All Products (for add product modal)
// ============================================
export async function getAllProducts(): Promise<StoreLayoutResult<Product[]>> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: t('cannotLoadProductsList') };
  }

  return { success: true, data: products as Product[] };
}

// ============================================
// SECTION: Create
// ============================================
export async function createSection(title: string): Promise<StoreLayoutResult<StoreSection>> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get max sort order
  const { data: maxOrderResult } = await supabase
    .from('store_sections')
    .select('sort_order')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderResult?.sort_order ?? -1) + 1;

  const { data: section, error } = await supabase
    .from('store_sections')
    .insert({
      creator_id: creatorId,
      title,
      sort_order: newOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Create section error:', error);
    return { success: false, error: t('cannotCreateSection') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true, data: section as StoreSection };
}

// ============================================
// SECTION: Update
// ============================================
export async function updateSection(sectionId: string, title: string): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('store_sections')
    .update({ title })
    .eq('id', sectionId)
    .eq('creator_id', creatorId);

  if (error) {
    return { success: false, error: t('cannotEditSection') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// SECTION: Delete
// ============================================
export async function deleteSection(sectionId: string): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Move items from this section to unsectioned
  await supabase
    .from('store_items')
    .update({ section_id: null })
    .eq('section_id', sectionId)
    .eq('creator_id', creatorId);

  // Delete section
  const { error } = await supabase
    .from('store_sections')
    .delete()
    .eq('id', sectionId)
    .eq('creator_id', creatorId);

  if (error) {
    return { success: false, error: t('cannotDeleteSection') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// ITEM: Add product to store
// ============================================
export async function addProductToStore(productId: string, sectionId?: string | null): Promise<StoreLayoutResult<StoreItem>> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from('store_items')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    return { success: false, error: t('productAlreadyInStore') };
  }

  // Get max sort order
  const { data: maxOrderResult } = await supabase
    .from('store_items')
    .select('sort_order')
    .eq('creator_id', creatorId)
    .eq('section_id', sectionId || null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderResult?.sort_order ?? -1) + 1;

  const { data: item, error } = await supabase
    .from('store_items')
    .insert({
      creator_id: creatorId,
      product_id: productId,
      section_id: sectionId || null,
      sort_order: newOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Add product to store error:', error);
    return { success: false, error: t('cannotAddProduct') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true, data: item as StoreItem };
}

// ============================================
// ITEM: Remove from store
// ============================================
export async function removeProductFromStore(itemId: string): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('store_items')
    .delete()
    .eq('id', itemId)
    .eq('creator_id', creatorId);

  if (error) {
    return { success: false, error: t('cannotRemoveProduct') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// ITEM: Toggle visibility
// ============================================
export async function toggleItemVisibility(itemId: string, isVisible: boolean): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('store_items')
    .update({ is_visible: isVisible })
    .eq('id', itemId)
    .eq('creator_id', creatorId);

  if (error) {
    return { success: false, error: t('cannotToggleStatus') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// REORDER: Update sort orders for items
// ============================================
export async function reorderItems(
  items: { id: string; sort_order: number; section_id: string | null }[]
): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Update each item
  for (const item of items) {
    const { error } = await supabase
      .from('store_items')
      .update({ sort_order: item.sort_order, section_id: item.section_id })
      .eq('id', item.id)
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Reorder item error:', error);
      return { success: false, error: t('cannotReorderProducts') };
    }
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// REORDER: Update sort orders for sections
// ============================================
export async function reorderSections(
  sections: { id: string; sort_order: number }[]
): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  for (const section of sections) {
    const { error } = await supabase
      .from('store_sections')
      .update({ sort_order: section.sort_order })
      .eq('id', section.id)
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Reorder section error:', error);
      return { success: false, error: t('cannotReorderSections') };
    }
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// MOVE: Move item to different section
// ============================================
export async function moveItemToSection(itemId: string, sectionId: string | null): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  // Get max sort order in target section
  const { data: maxOrderResult } = await supabase
    .from('store_items')
    .select('sort_order')
    .eq('creator_id', creatorId)
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderResult?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from('store_items')
    .update({ section_id: sectionId, sort_order: newOrder })
    .eq('id', itemId)
    .eq('creator_id', creatorId);

  if (error) {
    return { success: false, error: t('cannotMoveProduct') };
  }

  revalidatePath('/dashboard/my-store');
  return { success: true };
}

// ============================================
// DESIGN: Update store design settings
// ============================================
export async function updateStoreDesign(design: StoreDesign): Promise<StoreLayoutResult> {
  const t = await getTranslations('ServerActions');
  const creatorId = await getCreatorId();
  if (!creatorId) {
    return { success: false, error: t('pleaseLogin') };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('creators')
    .update({ store_design: design })
    .eq('id', creatorId);

  if (error) {
    console.error('Update store design error:', error);
    return { success: false, error: t('cannotSaveSettings') };
  }

  revalidatePath('/dashboard/my-store');
  revalidatePath(`/u`);
  return { success: true };
}
