import { Navbar, Footer } from '@/components/landing';

export const metadata = {
  title: 'นโยบายความเป็นส่วนตัว | Sellio',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของ Sellio',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-muted-foreground mb-8">อัปเดตล่าสุด: 6 กุมภาพันธ์ 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <p>นโยบายนี้อธิบายวิธีที่ Sellio (trysellio.com) เก็บรวบรวม ใช้ และคุ้มครองข้อมูลส่วนบุคคลของท่าน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. ข้อมูลที่เราเก็บรวบรวม</h2>
            
            <h3 className="font-medium mt-4 mb-2">1.1 ข้อมูล Creator</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>อีเมลและรหัสผ่าน (เข้ารหัส)</li>
              <li>ชื่อที่แสดง, Username, Bio</li>
              <li>รูปโปรไฟล์</li>
              <li>ข้อมูลการรับเงิน (เบอร์ PromptPay, บัญชีธนาคาร)</li>
              <li>ช่องทางติดต่อ (โทร, Line, IG, Email)</li>
            </ul>

            <h3 className="font-medium mt-4 mb-2">1.2 ข้อมูลลูกค้า (ผู้ซื้อ)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>ชื่อ, อีเมล, เบอร์โทร (ถ้ามี)</li>
              <li>ข้อมูลการสั่งซื้อ</li>
              <li>สลิปการโอนเงิน</li>
            </ul>

            <h3 className="font-medium mt-4 mb-2">1.3 ข้อมูลการใช้งาน</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>ข้อมูลการเข้าถึงเว็บไซต์ (IP, Browser, อุปกรณ์)</li>
              <li>สถิติการใช้งานแพลตฟอร์ม</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>ให้บริการ:</strong> สร้างหน้าร้าน, ประมวลผลออเดอร์, ส่งอีเมลยืนยัน</li>
              <li><strong>การชำระเงิน:</strong> สร้าง QR Code PromptPay, แสดงข้อมูลบัญชี, ประมวลผลผ่าน Stripe</li>
              <li><strong>การสื่อสาร:</strong> แจ้งเตือนออเดอร์ใหม่, อัปเดตบริการ</li>
              <li><strong>ปรับปรุงบริการ:</strong> วิเคราะห์การใช้งานเพื่อพัฒนาแพลตฟอร์ม</li>
              <li><strong>กฎหมาย:</strong> ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. ฐานทางกฎหมาย (PDPA)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>สัญญา:</strong> จำเป็นต่อการให้บริการตามที่ท่านสมัคร</li>
              <li><strong>ความยินยอม:</strong> สำหรับการส่งข่าวสาร/โปรโมชั่น (สามารถเพิกถอนได้)</li>
              <li><strong>ประโยชน์อันชอบธรรม:</strong> ปรับปรุงบริการ, ป้องกันการฉ้อโกง</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. การแบ่งปันข้อมูล</h2>
            <p>เราอาจแบ่งปันข้อมูลกับ:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> เก็บข้อมูลฐานข้อมูลและไฟล์ (เซิร์ฟเวอร์ในต่างประเทศ)</li>
              <li><strong>Stripe:</strong> ประมวลผลการชำระเงินแบบ Subscription</li>
              <li><strong>Resend:</strong> ส่งอีเมลแจ้งเตือน</li>
              <li><strong>Vercel:</strong> โฮสต์เว็บไซต์</li>
            </ul>
            <p className="mt-2">เราจะไม่ขายข้อมูลส่วนบุคคลของท่านให้บุคคลที่สาม</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. การโอนข้อมูลข้ามประเทศ</h2>
            <p>ข้อมูลอาจถูกจัดเก็บในเซิร์ฟเวอร์ต่างประเทศผ่านผู้ให้บริการ (Supabase, Stripe, Vercel) ซึ่งมีมาตรฐานการคุ้มครองข้อมูลที่เพียงพอ</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. ระยะเวลาเก็บรักษาข้อมูล</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ข้อมูลบัญชี: เก็บตลอดที่ยังใช้บริการ + 90 วันหลังปิดบัญชี</li>
              <li>ข้อมูลออเดอร์: เก็บ 5 ปีตามข้อกำหนดทางบัญชี</li>
              <li>สลิปการโอนเงิน: เก็บ 1 ปี</li>
              <li>ข้อมูลการใช้งาน: เก็บ 1 ปี</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. สิทธิของเจ้าของข้อมูล (PDPA)</h2>
            <p>ท่านมีสิทธิ:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>เข้าถึง:</strong> ขอสำเนาข้อมูลส่วนบุคคลของท่าน</li>
              <li><strong>แก้ไข:</strong> ขอให้แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
              <li><strong>ลบ:</strong> ขอให้ลบข้อมูลส่วนบุคคล (ภายใต้เงื่อนไข)</li>
              <li><strong>ระงับ:</strong> ขอให้ระงับการใช้ข้อมูล</li>
              <li><strong>คัดค้าน:</strong> คัดค้านการเก็บรวบรวมหรือใช้ข้อมูล</li>
              <li><strong>โอนย้าย:</strong> ขอรับข้อมูลในรูปแบบที่อ่านได้ด้วยเครื่อง</li>
              <li><strong>เพิกถอนความยินยอม:</strong> เพิกถอนความยินยอมที่เคยให้ไว้</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. การรักษาความปลอดภัย</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ข้อมูลถูกเข้ารหัสระหว่างการส่ง (SSL/TLS)</li>
              <li>รหัสผ่านถูกเข้ารหัสด้วย bcrypt</li>
              <li>ใช้ Row Level Security (RLS) ใน Supabase</li>
              <li>จำกัดการเข้าถึงข้อมูลเฉพาะผู้ที่จำเป็น</li>
            </ul>
          </section>

          <section id="cookies" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mt-8 mb-3">9. คุกกี้</h2>
            <p>เราใช้คุกกี้ที่จำเป็นสำหรับการทำงานของระบบ (เช่น session authentication) เราไม่ใช้คุกกี้ติดตามจากบุคคลที่สาม</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. การเปลี่ยนแปลงนโยบาย</h2>
            <p>เราอาจอัปเดตนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลทันทีที่ประกาศบนเว็บไซต์ เราจะแจ้งการเปลี่ยนแปลงสำคัญทางอีเมล</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล</h2>
            <p>หากท่านต้องการใช้สิทธิตาม PDPA หรือมีคำถามเกี่ยวกับนโยบายนี้:</p>
            <p className="mt-2"><strong>Email:</strong> sellio.team@gmail.com</p>
            <p className="text-sm text-muted-foreground mt-2">เราจะตอบกลับภายใน 30 วันทำการ</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
