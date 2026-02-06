import Link from 'next/link';
import { Button } from '@/components/ui';
import { Check, X, Sparkles, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'เริ่มขายได้เลย ไม่มีค่าใช้จ่าย',
    price: '0',
    period: 'ตลอดชีพ',
    highlight: false,
    features: [
      { text: 'หน้าร้านค้าส่วนตัว', included: true },
      { text: 'สินค้าสูงสุด 2 รายการ', included: true },
      { text: 'ออเดอร์ไม่จำกัด', included: true },
      { text: 'รับชำระผ่าน PromptPay', included: true },
      { text: 'ระบบจอง Booking + ปฏิทิน', included: true },
      { text: 'ข้อความตอบกลับลูกค้า', included: true },
      { text: 'แชร์ลิงก์ร้านค้า & สินค้า', included: true },
      { text: 'สถิติพื้นฐาน (ยอดขาย + สินค้าขายดี)', included: true },
      { text: 'ดูรีวิวจากลูกค้า (จำกัด)', included: true },
      { text: 'จัดการรีวิว (ปักหมุด / ซ่อน)', included: false },
      { text: 'ลบ Branding Sellio', included: false },
      { text: 'Export ข้อมูล', included: false },
    ],
    cta: 'เริ่มต้นฟรี',
    ctaVariant: 'outline' as const,
    ctaNote: 'ไม่ต้องใส่บัตรเครดิต',
  },
  {
    name: 'Pro',
    description: 'ขายจริงจัง ควบคุมร้านได้ทุกอย่าง',
    price: '3.3',
    period: '/วัน',
    monthlyPrice: '99 บาท/เดือน',
    highlight: true,
    features: [
      { text: 'ทุกอย่างใน Free', included: true, bold: true },
      { text: 'สินค้าไม่จำกัด', included: true, bold: true },
      { text: 'ออเดอร์ไม่จำกัด', included: true },
      { text: 'จัดการรีวิว (ปักหมุด / ซ่อน)', included: true, bold: true },
      { text: 'ลบ Branding Sellio', included: true },
      { text: 'Export ข้อมูล (ออเดอร์ / ลูกค้า / สินค้า)', included: true, bold: true },
      { text: 'Priority Support', included: true },
    ],
    cta: 'อัปเกรดเป็น Pro',
    ctaVariant: 'default' as const,
    ctaNote: 'แค่วันละ 3 บาท ยกเลิกได้ทุกเมื่อ',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            เริ่มต้น
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> ฟรี </span>
            อัปเกรดเมื่อพร้อม
          </h2>
          <p className="text-lg text-gray-600">
            ไม่มีค่าใช้จ่ายซ่อนเร้น ไม่มี lock-in — เริ่มขายได้เลยวันนี้
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-black text-white ring-4 ring-black/10 scale-[1.02]'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    แนะนำ
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm">฿</span>
                  <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                  {(plan as { monthlyPrice?: string }).monthlyPrice && (
                    <span className="text-sm text-gray-400 ml-1">
                      ({(plan as { monthlyPrice?: string }).monthlyPrice})
                    </span>
                  )}
                </div>
                {plan.highlight && (
                  <p className="text-sm text-purple-300 mt-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    ถูกกว่ากาแฟวันละแก้ว
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-green-400' : 'text-green-500'}`} />
                    ) : (
                      <X className="w-5 h-5 flex-shrink-0 text-gray-300" />
                    )}
                    <span className={`text-sm ${
                      !feature.included 
                        ? 'text-gray-400 line-through' 
                        : plan.highlight 
                          ? (feature as { bold?: boolean }).bold ? 'text-white font-medium' : 'text-gray-200'
                          : 'text-gray-600'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="space-y-2">
                <Link href="/signup" className="block">
                  <Button 
                    variant={plan.highlight ? 'secondary' : plan.ctaVariant}
                    className={`w-full ${plan.highlight ? 'bg-white text-black hover:bg-gray-100 font-semibold' : ''}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                {plan.ctaNote && (
                  <p className={`text-xs text-center ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                    {plan.ctaNote}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-4">
            <Check className="w-4 h-4 text-green-500" />
            ไม่ต้องใส่บัตรเครดิต
            <span className="text-gray-300">|</span>
            <Check className="w-4 h-4 text-green-500" />
            ยกเลิกได้ทุกเมื่อ
            <span className="text-gray-300">|</span>
            <Check className="w-4 h-4 text-green-500" />
            ไม่มีค่าใช้จ่ายซ่อนเร้น
          </div>
          <p className="text-gray-500">
            มีคำถาม? ดู{' '}
            <Link href="#faq" className="text-black font-medium hover:underline">
              คำถามที่พบบ่อย
            </Link>
            {' '}หรือ{' '}
            <Link href="#contact" className="text-black font-medium hover:underline">
              ติดต่อเรา
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
