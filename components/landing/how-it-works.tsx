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

        {/* Video/Demo Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ดูการใช้งานจริง
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                ลองดูว่าการสร้างร้านค้าและเริ่มขายสินค้าบน Sellio 
                ง่ายแค่ไหน ไม่ต้องมีความรู้ด้านเทคนิคเลย
              </p>
              <ul className="space-y-3">
                {[
                  'สร้างร้านค้าใน 1 นาที',
                  'อัปโหลดสินค้าดิจิทัลได้ทันที',
                  'ตั้งค่าการชำระเงินง่ายๆ',
                  'แชร์ลิงก์และเริ่มขาย'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Video Placeholder */}
            <div className="flex-1 w-full">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-colors group">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
