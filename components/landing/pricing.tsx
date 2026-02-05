import Link from 'next/link';
import { Button } from '@/components/ui';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'เริ่มต้นฟรี ไม่มีค่าใช้จ่าย',
    price: '0',
    period: 'ตลอดชีพ',
    highlight: false,
    features: [
      'สินค้าไม่จำกัด',
      'หน้าร้านค้าส่วนตัว',
      'รับชำระผ่าน PromptPay',
      'ค่าธรรมเนียม 5% ต่อรายการ',
      'รายงานยอดขายพื้นฐาน',
      'แชร์โซเชียลมีเดีย',
    ],
    cta: 'เริ่มต้นฟรี',
    ctaVariant: 'outline' as const
  },
  {
    name: 'Pro',
    description: 'สำหรับ Creator ที่ต้องการเติบโต',
    price: '299',
    period: '/เดือน',
    highlight: true,
    features: [
      'ทุกอย่างใน Free',
      'ค่าธรรมเนียมเหลือ 3%',
      'คูปองส่วนลดไม่จำกัด',
      'ระบบรีวิวและเรตติ้ง',
      'Dashboard วิเคราะห์ขั้นสูง',
      'ลบ Branding Sellio',
      'รองรับ Custom Domain',
      'Email แจ้งเตือนอัตโนมัติ',
    ],
    cta: 'เริ่มทดลองฟรี 14 วัน',
    ctaVariant: 'default' as const
  },
  {
    name: 'Business',
    description: 'สำหรับธุรกิจและทีม',
    price: '899',
    period: '/เดือน',
    highlight: false,
    features: [
      'ทุกอย่างใน Pro',
      'ค่าธรรมเนียมเหลือ 2%',
      'หลายผู้ใช้ต่อบัญชี',
      'API สำหรับ Integration',
      'Priority Support',
      'Export ข้อมูลไม่จำกัด',
      'Webhook สำหรับ Automation',
      'Account Manager',
    ],
    cta: 'ติดต่อเรา',
    ctaVariant: 'outline' as const
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ราคาที่
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> เป็นธรรม</span>
          </h2>
          <p className="text-lg text-gray-600">
            เริ่มต้นฟรีไม่มีค่าใช้จ่าย อัปเกรดเมื่อธุรกิจเติบโต
            ไม่มีค่าใช้จ่ายซ่อนเร้น
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-black text-white ring-4 ring-black/10 scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    ยอดนิยม
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
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm">฿</span>
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`text-sm ${plan.highlight ? 'text-gray-200' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/signup" className="block">
                <Button 
                  variant={plan.highlight ? 'secondary' : plan.ctaVariant}
                  className={`w-full ${plan.highlight ? 'bg-white text-black hover:bg-gray-100' : ''}`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-12">
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
