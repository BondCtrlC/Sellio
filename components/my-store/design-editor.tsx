'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Label, Input } from '@/components/ui';
import { Palette, Type, Check } from 'lucide-react';
import { updateStoreDesign } from '@/actions/store-layout';
import { DEFAULT_STORE_DESIGN, type StoreDesign } from '@/types';

interface DesignEditorProps {
  initialDesign: StoreDesign | null;
  onDesignChange: (design: StoreDesign) => void;
}

// Template Presets - Full layout + design
const TEMPLATES: { id: string; name: string; description: string; design: StoreDesign }[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'โปรไฟล์กลาง การ์ดแนวนอน',
    design: {
      ...DEFAULT_STORE_DESIGN,
    },
  },
  {
    id: 'hero',
    name: 'Hero',
    description: 'รูปโปรไฟล์เป็นพื้นหลัง',
    design: {
      profile_layout: 'hero',
      product_layout: 'compact',
      avatar_size: 'lg',
      theme_color: '#78350f',
      background_type: 'solid',
      background_color: '#fffbeb',
      background_gradient_from: '#fffbeb',
      background_gradient_to: '#ffffff',
      card_style: 'default',
      card_rounded: '2xl',
      card_shadow: 'md',
      font_family: 'default',
    },
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description: 'Minimal โปรไฟล์ การ์ด compact',
    design: {
      profile_layout: 'minimal',
      product_layout: 'compact',
      avatar_size: 'md',
      theme_color: '#3b82f6',
      background_type: 'gradient',
      background_color: '#eff6ff',
      background_gradient_from: '#dbeafe',
      background_gradient_to: '#ffffff',
      card_style: 'default',
      card_rounded: '2xl',
      card_shadow: 'md',
      font_family: 'default',
    },
  },
  {
    id: 'nightview',
    name: 'Nightview',
    description: 'สไตล์โดดเด่น การ์ดแนวตั้ง',
    design: {
      profile_layout: 'centered',
      product_layout: 'vertical',
      avatar_size: 'lg',
      theme_color: '#14b8a6',
      background_type: 'gradient',
      background_color: '#fdf2f8',
      background_gradient_from: '#fce7f3',
      background_gradient_to: '#fdf4ff',
      card_style: 'default',
      card_rounded: 'xl',
      card_shadow: 'sm',
      font_family: 'default',
    },
  },
];

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#1e293b', // Slate
  '#000000', // Black
];

const FONT_OPTIONS = [
  { value: 'default', label: 'Default', preview: 'font-default' },
  { value: 'sarabun', label: 'Sarabun', preview: 'font-sarabun' },
  { value: 'prompt', label: 'Prompt', preview: 'font-prompt' },
  { value: 'noto', label: 'Noto Sans', preview: 'font-noto' },
  { value: 'ibm', label: 'IBM Plex', preview: 'font-ibm' },
  { value: 'pridi', label: 'Pridi', preview: 'font-pridi' },
];

export function DesignEditor({ initialDesign, onDesignChange }: DesignEditorProps) {
  const [design, setDesign] = useState<StoreDesign>(initialDesign || DEFAULT_STORE_DESIGN);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Find current template (match by layout + colors)
  const currentTemplateId = TEMPLATES.find(t => 
    t.design.profile_layout === design.profile_layout &&
    t.design.product_layout === design.product_layout &&
    t.design.theme_color === design.theme_color
  )?.id || 'custom';

  // Notify parent of changes
  useEffect(() => {
    onDesignChange(design);
  }, [design, onDesignChange]);

  const updateField = <K extends keyof StoreDesign>(field: K, value: StoreDesign[K]) => {
    setDesign(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setDesign(template.design);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateStoreDesign(design);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Presets */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">เลือก Template</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((template) => {
              const isActive = currentTemplateId === template.id;
              const d = template.design;
              const isHero = d.profile_layout === 'hero';
              const isVertical = d.product_layout === 'vertical';
              const isCompact = d.product_layout === 'compact';
              
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`relative p-2 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  {/* Mini Preview */}
                  <div 
                    className="h-28 rounded-lg mb-2 overflow-hidden"
                    style={{ 
                      background: d.background_type === 'gradient' 
                        ? `linear-gradient(to bottom, ${d.background_gradient_from}, ${d.background_gradient_to})`
                        : d.background_color
                    }}
                  >
                    {/* Hero Layout - Profile image as background */}
                    {isHero ? (
                      <>
                        <div 
                          className="h-14 w-full flex flex-col items-center justify-center relative"
                          style={{ backgroundColor: '#a8a29e' }}
                        >
                          {/* Simulated profile bg */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
                          <div className="relative z-10 text-white text-center">
                            <div className="h-2 w-12 bg-white/90 rounded mx-auto mb-1" />
                            <div className="h-1.5 w-8 bg-white/60 rounded mx-auto" />
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="bg-white rounded-lg shadow-sm h-4 flex items-center px-1.5">
                            <div className="w-2 h-2 rounded bg-gray-200 mr-1" />
                            <div className="h-1 flex-1 bg-gray-200 rounded" />
                          </div>
                          <div className="bg-white rounded-lg shadow-sm h-4 flex items-center px-1.5">
                            <div className="w-2 h-2 rounded bg-gray-200 mr-1" />
                            <div className="h-1 flex-1 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 pt-3">
                        {/* Profile */}
                        <div className={`flex ${d.profile_layout === 'minimal' ? 'flex-row items-center gap-2' : 'flex-col items-center'} mb-2`}>
                          <div 
                            className={`rounded-full border-2 border-white ${
                              d.avatar_size === 'sm' ? 'w-4 h-4' : 
                              d.avatar_size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
                            }`}
                            style={{ backgroundColor: d.theme_color }}
                          />
                          {d.profile_layout === 'minimal' && (
                            <div className="flex-1">
                              <div className="h-1.5 w-10 bg-gray-300 rounded" />
                            </div>
                          )}
                        </div>
                        
                        {/* Products */}
                        {isVertical ? (
                          <div className="grid grid-cols-2 gap-1">
                            <div className="bg-white rounded shadow-sm p-1">
                              <div className="h-6 bg-gray-100 rounded mb-1" />
                              <div className="h-1 w-8 bg-gray-200 rounded" />
                            </div>
                            <div className="bg-white rounded shadow-sm p-1">
                              <div className="h-6 bg-gray-100 rounded mb-1" />
                              <div className="h-1 w-8 bg-gray-200 rounded" />
                            </div>
                          </div>
                        ) : isCompact ? (
                          <div className="space-y-1">
                            <div className="bg-white rounded-lg shadow-sm h-4 flex items-center px-1.5">
                              <div className="w-2 h-2 rounded bg-gray-200 mr-1" />
                              <div className="h-1 flex-1 bg-gray-200 rounded" />
                            </div>
                            <div className="bg-white rounded-lg shadow-sm h-4 flex items-center px-1.5">
                              <div className="w-2 h-2 rounded bg-gray-200 mr-1" />
                              <div className="h-1 flex-1 bg-gray-200 rounded" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="bg-white rounded shadow-sm h-5 flex">
                              <div className="w-5 h-5 bg-gray-100 rounded-l" />
                              <div className="flex-1 p-1">
                                <div className="h-1 w-full bg-gray-200 rounded" />
                              </div>
                            </div>
                            <div className="bg-white rounded shadow-sm h-5 flex">
                              <div className="w-5 h-5 bg-gray-100 rounded-l" />
                              <div className="flex-1 p-1">
                                <div className="h-1 w-full bg-gray-200 rounded" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Template Info */}
                  <div className="text-center">
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground">{template.description}</p>
                  </div>
                  
                  {/* Check mark */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">ปรับแต่งสี</h3>
          </div>

          {/* Theme Color */}
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground mb-2 block">สีหลัก</Label>
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-6 gap-1.5 flex-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateField('theme_color', color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      design.theme_color === color 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={design.theme_color}
                onChange={(e) => updateField('theme_color', e.target.value)}
                className="w-10 h-10 p-0 border-0 cursor-pointer rounded-lg"
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">พื้นหลัง</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={design.background_type === 'gradient' ? design.background_gradient_from : design.background_color}
                onChange={(e) => {
                  if (design.background_type === 'gradient') {
                    updateField('background_gradient_from', e.target.value);
                  } else {
                    updateField('background_color', e.target.value);
                  }
                }}
                className="w-10 h-10 p-0 border-0 cursor-pointer rounded-lg"
              />
              {design.background_type === 'gradient' && (
                <>
                  <span className="text-muted-foreground text-sm">→</span>
                  <Input
                    type="color"
                    value={design.background_gradient_to}
                    onChange={(e) => updateField('background_gradient_to', e.target.value)}
                    className="w-10 h-10 p-0 border-0 cursor-pointer rounded-lg"
                  />
                </>
              )}
              <button
                onClick={() => updateField('background_type', design.background_type === 'solid' ? 'gradient' : 'solid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  design.background_type === 'gradient'
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                ไล่สี
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">ฟอนต์</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => updateField('font_family', font.value as StoreDesign['font_family'])}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  design.font_family === font.value
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
        size="lg"
      >
        {saving ? 'กำลังบันทึก...' : saved ? '✓ บันทึกแล้ว' : 'บันทึก'}
      </Button>
    </div>
  );
}
