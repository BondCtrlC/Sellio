'use client';

import { useState, useCallback } from 'react';
import { StoreEditor } from '@/components/my-store/store-editor';
import { MobilePreview } from '@/components/my-store/mobile-preview';
import { DesignEditor } from '@/components/my-store/design-editor';
import { ExternalLink, LayoutGrid, Palette, Eye, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { DEFAULT_STORE_DESIGN } from '@/types';
import type { Creator, StoreSectionWithItems, StoreItemWithProduct, StoreDesign } from '@/types';
import { useTranslations } from 'next-intl';

interface MyStoreClientProps {
  creator: Creator;
  sections: StoreSectionWithItems[];
  unsectionedItems: StoreItemWithProduct[];
}

type TabType = 'store' | 'design';

export function MyStoreClient({ creator, sections, unsectionedItems }: MyStoreClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<StoreDesign>(
    creator.store_design || DEFAULT_STORE_DESIGN
  );
  const t = useTranslations('MyStore');

  // Update creator with current design for preview
  const creatorWithDesign = {
    ...creator,
    store_design: currentDesign,
  };

  const handleDesignChange = useCallback((design: StoreDesign) => {
    setCurrentDesign(design);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href={`/u/${creator.username}`} target="_blank">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('viewStore')}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'store'
              ? 'bg-white shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          {t('manageStore')}
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'design'
              ? 'bg-white shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          {t('customizeDesign')}
        </button>
      </div>

      {/* Mobile: Toggle between Editor & Preview */}
      <div className="flex lg:hidden gap-1 mb-4 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setShowMobilePreview(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !showMobilePreview
              ? 'bg-white shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Pencil className="h-4 w-4" />
          {t('editor')}
        </button>
        <button
          onClick={() => setShowMobilePreview(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            showMobilePreview
              ? 'bg-white shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-4 w-4" />
          {t('preview')}
        </button>
      </div>

      {/* Two Column Layout (Desktop) / Toggle (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-8rem)]">
        {/* Left: Editor */}
        <div className={`overflow-y-auto pr-2 ${showMobilePreview ? 'hidden lg:block' : ''}`}>
          {activeTab === 'store' ? (
            <StoreEditor
              creator={creator}
              sections={sections}
              unsectionedItems={unsectionedItems}
            />
          ) : (
            <DesignEditor
              initialDesign={creator.store_design}
              onDesignChange={handleDesignChange}
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className={`items-start justify-center bg-muted/30 rounded-xl p-4 sm:p-6 ${
          showMobilePreview ? 'flex' : 'hidden lg:flex'
        }`}>
          <MobilePreview
            creator={creatorWithDesign}
            sections={sections}
            unsectionedItems={unsectionedItems}
            design={currentDesign}
          />
        </div>
      </div>
    </div>
  );
}
