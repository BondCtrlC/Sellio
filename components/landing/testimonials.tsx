import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'ณิชา พรหมมินทร์',
    role: 'นักวาดภาพประกอบ',
    avatar: '👩‍🎨',
    content: 'ขาย Preset และ Template ผ่าน CreatorShop มาเกือบปี ใช้งานง่ายมาก ลูกค้าชำระผ่าน QR ได้เลย ไม่ต้องมานั่งตอบแชทส่งไฟล์เอง',
    rating: 5
  },
  {
    name: 'ธนกฤต ศรีวิชัย',
    role: 'โค้ชสอนภาษาอังกฤษ',
    avatar: '👨‍🏫',
    content: 'ระบบจองคิวปรึกษาดีมาก เปิดให้จองได้หลาย slot มีแจ้งเตือนอัตโนมัติ ไม่พลาดนัดหมายเลย รายได้เพิ่มขึ้น 3 เท่า',
    rating: 5
  },
  {
    name: 'กมลวรรณ จันทร์สว่าง',
    role: 'YouTuber & Content Creator',
    avatar: '📱',
    content: 'ใส่ลิงก์เดียวใน Bio ได้หมดทุกอย่าง ทั้งขาย E-book, คอร์สออนไลน์ และ Affiliate link Dashboard สวยงาม ดูยอดขายได้ชัดเจน',
    rating: 5
  },
  {
    name: 'พิชญ์ รัตนพงศ์',
    role: 'Graphic Designer',
    avatar: '🎨',
    content: 'เคยลองหลายแพลตฟอร์ม CreatorShop ใช้ง่ายที่สุด รองรับภาษาไทยเต็มที่ ค่าธรรมเนียมถูก เหมาะกับ Creator ไทยมาก',
    rating: 5
  },
  {
    name: 'วริศรา แก้วมณี',
    role: 'ช่างภาพ Freelance',
    avatar: '📸',
    content: 'ขาย Lightroom Preset กับ Photography Course ได้สะดวกมาก ลูกค้าจ่ายเงินปุ๊บ ได้ไฟล์ปั๊บ ไม่ต้องมาส่งเองให้เหนื่อย',
    rating: 5
  },
  {
    name: 'ธีรภัทร วงศ์สุวรรณ',
    role: 'Music Producer',
    avatar: '🎵',
    content: 'ขาย Beat และ Sample pack ได้ง่ายมาก ตั้งราคาได้หลายระดับ มี License แต่ละแบบ ลูกค้าต่างชาติก็ซื้อได้',
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Creator ไทยกว่า 1,000+ คน
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> ไว้วางใจ</span>
          </h2>
          <p className="text-lg text-gray-600">
            ดูว่า Creator คนอื่นๆ พูดถึงเราว่าอย่างไร
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '1,000+', label: 'Creator ใช้งาน' },
            { value: '50,000+', label: 'สินค้าขายไปแล้ว' },
            { value: '฿10M+', label: 'ยอดขายรวม' },
            { value: '4.9/5', label: 'คะแนนรีวิว' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
