'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { 
  MessageSquare, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface OrderInfo {
  id: string;
  buyer_name: string;
  buyer_email: string;
  total: number;
  product_title: string;
  product_type: string;
  booking_date?: string | null;
  booking_time?: string | null;
  status: string;
}

interface QuickReplyProps {
  order: OrderInfo;
  creatorName?: string;
}

type TemplateCategory = 'confirmation' | 'reminder' | 'thankyou' | 'issue';

interface Template {
  id: string;
  category: TemplateCategory;
  nameKey: string;
  getMessage: (order: OrderInfo, creatorName: string) => string;
}

const templates: Template[] = [
  // Confirmation templates
  {
    id: 'confirm_payment',
    category: 'confirmation',
    nameKey: 'tplConfirmPayment',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name} 🙏

ได้รับการชำระเงินเรียบร้อยแล้วค่ะ/ครับ
📦 สินค้า: ${order.product_title}
💰 จำนวน: ${formatPrice(order.total)}

${order.product_type === 'digital' 
  ? 'ระบบได้ส่งลิงก์ดาวน์โหลดไปทางอีเมลแล้วนะคะ/ครับ กรุณาเช็คอีเมล ' + order.buyer_email
  : order.booking_date 
    ? `📅 นัดหมาย: ${formatDate(order.booking_date)} เวลา ${order.booking_time?.slice(0,5) || ''}\nรายละเอียดการเข้าร่วมจะส่งไปทางอีเมลค่ะ/ครับ`
    : 'รายละเอียดจะส่งไปทางอีเมลค่ะ/ครับ'
}

ขอบคุณที่อุดหนุนนะคะ/ครับ 💕
${creator}`
  },
  {
    id: 'confirm_order',
    category: 'confirmation',
    nameKey: 'tplConfirmOrder',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name}

ได้รับคำสั่งซื้อเรียบร้อยแล้วค่ะ/ครับ ✅
📦 ${order.product_title}
💰 ${formatPrice(order.total)}

รอตรวจสอบการชำระเงินสักครู่นะคะ/ครับ
ขอบคุณค่ะ/ครับ 🙏
${creator}`
  },

  // Reminder templates
  {
    id: 'booking_reminder',
    category: 'reminder',
    nameKey: 'tplBookingReminder',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name} 📅

แจ้งเตือนนัดหมายค่ะ/ครับ
📦 ${order.product_title}
${order.booking_date ? `📅 วันที่: ${formatDate(order.booking_date)}` : ''}
${order.booking_time ? `⏰ เวลา: ${order.booking_time.slice(0,5)} น.` : ''}

เจอกันนะคะ/ครับ! 😊
${creator}`
  },
  {
    id: 'payment_reminder',
    category: 'reminder',
    nameKey: 'tplPaymentReminder',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name}

แจ้งเตือนการชำระเงินค่ะ/ครับ 🙏
📦 ${order.product_title}
💰 ${formatPrice(order.total)}

หากชำระเงินแล้ว รบกวนอัพโหลดสลิปด้วยนะคะ/ครับ
หากมีปัญหาสามารถทักมาสอบถามได้เลยค่ะ/ครับ

ขอบคุณค่ะ/ครับ
${creator}`
  },

  // Thank you templates
  {
    id: 'thankyou_purchase',
    category: 'thankyou',
    nameKey: 'tplThankPurchase',
    getMessage: (order, creator) => 
`ขอบคุณมากค่ะ/ครับ คุณ${order.buyer_name} 💕

ขอบคุณที่อุดหนุน "${order.product_title}" นะคะ/ครับ
หวังว่าจะถูกใจและเป็นประโยชน์ค่ะ/ครับ ✨

หากมีคำถามหรือต้องการความช่วยเหลือ
ทักมาได้เลยนะคะ/ครับ 😊

${creator}`
  },
  {
    id: 'thankyou_review',
    category: 'thankyou',
    nameKey: 'tplThankReview',
    getMessage: (order, creator) => 
`ขอบคุณสำหรับรีวิวค่ะ/ครับ คุณ${order.buyer_name} 🙏💕

รีวิวของคุณมีค่ามากๆ เลยค่ะ/ครับ
ช่วยให้เราพัฒนาต่อไปได้ ✨

หวังว่าจะได้รับใช้อีกนะคะ/ครับ 😊
${creator}`
  },

  // Issue templates
  {
    id: 'issue_slip',
    category: 'issue',
    nameKey: 'tplIssueSlip',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name}

รบกวนส่งสลิปใหม่อีกครั้งได้ไหมคะ/ครับ 🙏
สลิปที่ส่งมาไม่ค่อยชัด/ตรวจสอบไม่ได้ค่ะ/ครับ

📦 สินค้า: ${order.product_title}
💰 จำนวน: ${formatPrice(order.total)}

ขอบคุณค่ะ/ครับ
${creator}`
  },
  {
    id: 'issue_amount',
    category: 'issue',
    nameKey: 'tplIssueAmount',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name}

ยอดเงินที่โอนมาไม่ตรงกับราคาสินค้าค่ะ/ครับ 🙏
📦 สินค้า: ${order.product_title}
💰 ราคา: ${formatPrice(order.total)}

รบกวนตรวจสอบและแจ้งกลับด้วยนะคะ/ครับ
ขอบคุณค่ะ/ครับ
${creator}`
  },
  {
    id: 'issue_refund',
    category: 'issue',
    nameKey: 'tplIssueRefund',
    getMessage: (order, creator) => 
`สวัสดีค่ะ/ครับ คุณ${order.buyer_name}

แจ้งคืนเงินค่ะ/ครับ
📦 สินค้า: ${order.product_title}
💰 จำนวนคืน: ${formatPrice(order.total)}

ได้โอนเงินคืนเรียบร้อยแล้วค่ะ/ครับ
รบกวนตรวจสอบบัญชีด้วยนะคะ/ครับ 🙏

ขออภัยในความไม่สะดวกค่ะ/ครับ
${creator}`
  },
];

export function QuickReply({ order, creatorName = 'ผู้ขาย' }: QuickReplyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const t = useTranslations('QuickReply');

  const categoryLabels: Record<TemplateCategory, string> = {
    confirmation: t('catConfirmation'),
    reminder: t('catReminder'),
    thankyou: t('catThankyou'),
    issue: t('catIssue'),
  };

  const handleCopy = async (template: Template) => {
    const message = template.getMessage(order, creatorName);
    
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(tpl => tpl.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <Button
        variant="outline"
        className="w-full justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {t('title')}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Templates Panel */}
      {isOpen && (
        <div className="border border-blue-200 rounded-lg bg-blue-50/50 overflow-hidden">
          {/* Category Filter */}
          <div className="flex gap-1 p-2 border-b border-blue-200 bg-white overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t('all')}
            </button>
            {(Object.keys(categoryLabels) as TemplateCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Templates List */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-2">
            {filteredTemplates.map(template => (
              <div 
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                    {t(template.nameKey as any)}
                  </span>
                  <Button
                    size="sm"
                    variant={copiedId === template.id ? 'default' : 'outline'}
                    className={`h-7 text-xs ${
                      copiedId === template.id 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                    }`}
                    onClick={() => handleCopy(template)}
                  >
                    {copiedId === template.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        {t('copy')}
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-2 text-xs text-gray-600 whitespace-pre-line max-h-32 overflow-y-auto">
                  {template.getMessage(order, creatorName)}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="p-2 border-t border-blue-200 bg-white">
            <p className="text-xs text-gray-500 text-center">
              {t('tip')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
