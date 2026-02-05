'use client';

import { DEFAULT_STORE_DESIGN, type StoreDesign } from '@/types';

interface StoreWrapperProps {
  children: React.ReactNode;
  design: StoreDesign | null;
}

// Font class mapping
const fontClassMap: Record<string, string> = {
  default: 'font-default',
  sarabun: 'font-sarabun',
  prompt: 'font-prompt',
  noto: 'font-noto',
  ibm: 'font-ibm',
  pridi: 'font-pridi',
};

export function StoreWrapper({ children, design }: StoreWrapperProps) {
  const currentDesign = design || DEFAULT_STORE_DESIGN;
  
  // Generate background style
  const backgroundStyle = currentDesign.background_type === 'gradient'
    ? { background: `linear-gradient(to bottom, ${currentDesign.background_gradient_from}, ${currentDesign.background_gradient_to})` }
    : { backgroundColor: currentDesign.background_color };

  // Get font class
  const fontClass = fontClassMap[currentDesign.font_family || 'default'] || 'font-default';

  return (
    <div className={`min-h-screen ${fontClass}`} style={backgroundStyle}>
      {children}
    </div>
  );
}
