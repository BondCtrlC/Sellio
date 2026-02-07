import type { Metadata } from 'next';
import { Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer } from '@/components/landing';

export const metadata: Metadata = {
  title: "Sellio - ขายของออนไลน์ง่ายๆ ผ่านลิงก์เดียว",
  description: "หยุดตอบแชทส่งไฟล์ทั้งวัน แพลตฟอร์มขายสินค้าดิจิทัลสำหรับ Content Creator ไทย ไม่ต้องตอบแชท ไม่ต้องมีเว็บไซต์ เริ่มขายได้ทันที เริ่มต้นฟรี",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
