import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Creator กว่า 1,000+ คนใช้งานแล้ว
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            ขายของออนไลน์
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              ผ่านลิงก์เดียว
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            แพลตฟอร์มขายสินค้าดิจิทัลที่ออกแบบมาสำหรับ Content Creator ไทย 
            ไม่ต้องเขียนโค้ด ไม่ต้องมีเว็บไซต์ เริ่มขายได้ทันที
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-base gap-2 shadow-lg shadow-black/10">
                เริ่มต้นฟรี
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base gap-2">
                <Play className="w-5 h-5" />
                ดูวิธีใช้งาน
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>ฟรี ไม่มีค่าแรกเข้า</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>ไม่ต้องผูกบัตรเครดิต</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>เริ่มขายได้ใน 5 นาที</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Mockup */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl">
            {/* Browser Frame */}
            <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200 overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1.5 text-sm text-gray-400 text-center border border-gray-200">
                    creatorshop.co/u/yourname
                  </div>
                </div>
              </div>
              
              {/* Dashboard Preview */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">🛍️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">ร้านค้าของคุณ</h3>
                  <p className="text-gray-500">หน้าร้านพร้อมใช้งาน รอแค่สินค้าของคุณ</p>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-4 top-1/3 bg-white rounded-xl shadow-lg p-4 border border-gray-100 hidden lg:block animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">ยอดขายวันนี้</p>
                  <p className="text-lg font-bold text-green-600">฿12,450</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/4 bg-white rounded-xl shadow-lg p-4 border border-gray-100 hidden lg:block animate-float animation-delay-1000">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">คำสั่งซื้อใหม่</p>
                  <p className="text-lg font-bold text-purple-600">+15 รายการ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
