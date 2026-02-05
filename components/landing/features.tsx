import { 
  ShoppingBag, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  Tag, 
  Star, 
  Link as LinkIcon, 
  FileDown,
  Users,
  Bell,
  Palette,
  Share2
} from 'lucide-react';

const features = [
  {
    icon: ShoppingBag,
    title: 'ขายได้ทุกอย่าง',
    description: 'ไฟล์ดิจิทัล, คอร์สออนไลน์, E-book, Template, Preset และอื่นๆ',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Calendar,
    title: 'นัดหมาย & Live Session',
    description: 'เปิดจองคิวปรึกษา, คอร์สสอนตัวต่อตัว, Live coaching',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: CreditCard,
    title: 'รับเงินง่าย',
    description: 'รองรับ PromptPay QR, โอนเงิน, แจ้งชำระอัตโนมัติ',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: BarChart3,
    title: 'วิเคราะห์ยอดขาย',
    description: 'Dashboard แสดงสถิติครบถ้วน รู้ยอดขายแบบ real-time',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: Tag,
    title: 'คูปองส่วนลด',
    description: 'สร้างโค้ดส่วนลดได้ไม่จำกัด กำหนดเงื่อนไขตามต้องการ',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    icon: Star,
    title: 'รีวิว & เรตติ้ง',
    description: 'ลูกค้าให้รีวิวได้ สร้างความน่าเชื่อถือให้สินค้า',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: LinkIcon,
    title: 'Affiliate Link',
    description: 'วางลิงก์พันธมิตรได้ทันที เก็บค่าคอมมิชชั่น',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    icon: FileDown,
    title: 'ส่งมอบไฟล์ปลอดภัย',
    description: 'ยืนยันการชำระก่อนส่งมอบ ป้องกันการโกง',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    icon: Users,
    title: 'จัดการลูกค้า',
    description: 'เก็บข้อมูลลูกค้า ดูประวัติการซื้อ Export เป็น CSV',
    color: 'bg-rose-100 text-rose-600'
  },
  {
    icon: Bell,
    title: 'แจ้งเตือนครบ',
    description: 'แจ้งเตือนออเดอร์ใหม่ ส่งอีเมลยืนยันอัตโนมัติ',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    icon: Palette,
    title: 'ปรับแต่งหน้าร้าน',
    description: 'เลือกธีม เปลี่ยนสี ใส่โลโก้ ทำให้เป็นแบรนด์คุณ',
    color: 'bg-teal-100 text-teal-600'
  },
  {
    icon: Share2,
    title: 'แชร์โซเชียล',
    description: 'ปุ่มแชร์ Facebook, X, Line พร้อม SEO ครบ',
    color: 'bg-violet-100 text-violet-600'
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ทุกอย่างที่คุณต้องการ
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> ในที่เดียว</span>
          </h2>
          <p className="text-lg text-gray-600">
            ฟีเจอร์ครบครันที่จะช่วยให้คุณขายของออนไลน์ได้อย่างมืออาชีพ
            โดยไม่ต้องเสียเวลาจัดการเรื่องยุ่งยาก
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
