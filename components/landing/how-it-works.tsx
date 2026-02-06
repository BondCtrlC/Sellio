import { UserPlus, Package, Share, Banknote } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'สมัครฟรี',
    description: 'ใช้เวลาไม่ถึง 1 นาที สร้างบัญชีและได้ลิงก์ร้านค้าทันที',
    color: 'from-purple-500 to-purple-600'
  },
  {
    number: '02',
    icon: Package,
    title: 'เพิ่มสินค้า',
    description: 'อัปโหลดไฟล์ ตั้งราคา เขียนรายละเอียด พร้อมขายใน 5 นาที',
    color: 'from-blue-500 to-blue-600'
  },
  {
    number: '03',
    icon: Share,
    title: 'แชร์ลิงก์',
    description: 'แชร์ลิงก์ร้านค้าไปยัง Bio, Facebook, Instagram, TikTok',
    color: 'from-pink-500 to-pink-600'
  },
  {
    number: '04',
    icon: Banknote,
    title: 'รับเงิน',
    description: 'ลูกค้าชำระผ่าน PromptPay เงินเข้าบัญชีคุณโดยตรง',
    color: 'from-green-500 to-green-600'
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            เริ่มต้นง่ายๆ
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> ใน 4 ขั้นตอน</span>
          </h2>
          <p className="text-lg text-gray-600">
            ไม่ต้องมีความรู้ด้านเทคนิค ไม่ต้องเขียนโค้ด 
            ทำตามขั้นตอนง่ายๆ แล้วเริ่มขายได้เลย
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}
              
              <div className="relative z-10 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
