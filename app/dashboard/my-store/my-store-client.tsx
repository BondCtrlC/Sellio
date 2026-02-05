'use client';

import { useState, useCallback } from 'react';
import { StoreEditor } from '@/components/my-store/store-editor';
import { MobilePreview } from '@/components/my-store/mobile-preview';
import { DesignEditor } from '@/components/my-store/design-editor';
import { ExternalLink, LayoutGrid, Palette } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { DEFAULT_STORE_DESIGN } from '@/types';
import type { Creator, StoreSectionWithItems, StoreItemWithProduct, StoreDesign } from '@/types';

interface MyStoreClientProps {
  creator: Creator;
  sections: StoreSectionWithItems[];
  unsectionedItems: StoreItemWithProduct[];
}

type TabType = 'store' | 'design';

export function MyStoreClient({ creator, sections, unsectionedItems }: MyStoreClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [currentDesign, setCurrentDesign] = useState<StoreDesign>(
    creator.store_design || DEFAULT_STORE_DESIGN
  );

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
          <h2 className="text-2xl font-bold">ร้านค้าของฉัน</h2>
          <p className="text-muted-foreground">จัดการหน้าร้านค้าและการแสดงผล</p>
        </div>
        <Link href={`/u/${creator.username}`} target="_blank">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            ดูหน้าร้าน
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
          จัดการร้านค้า
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
          ปรับแต่ง Design
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-8rem)]">
        {/* Left: Editor */}
        <div className="overflow-y-auto pr-2">
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
        <div className="hidden lg:flex items-start justify-center bg-muted/30 rounded-xl p-6">
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
