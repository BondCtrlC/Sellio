import { Navbar, Footer } from '@/components/landing';

export const metadata = {
  title: 'ข้อกำหนดการใช้งาน | Sellio',
  description: 'ข้อกำหนดและเงื่อนไขการใช้บริการ Sellio',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">ข้อกำหนดการใช้งาน</h1>
        <p className="text-muted-foreground mb-8">อัปเดตล่าสุด: 6 กุมภาพันธ์ 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. คำจำกัดความ</h2>
            <p>&quot;แพลตฟอร์ม&quot; หมายถึง Sellio (trysellio.com) ซึ่งเป็นแพลตฟอร์มสำหรับ Creator ขายสินค้าและบริการดิจิทัล</p>
            <p>&quot;ผู้ใช้งาน&quot; หมายถึง Creator ที่สมัครใช้งานแพลตฟอร์ม และลูกค้าที่ซื้อสินค้า/บริการผ่านแพลตฟอร์ม</p>
            <p>&quot;Creator&quot; หมายถึง ผู้ที่สมัครบัญชีเพื่อขายสินค้าหรือบริการผ่านแพลตฟอร์ม</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. การยอมรับข้อกำหนด</h2>
            <p>การใช้งานแพลตฟอร์มถือว่าท่านยอมรับข้อกำหนดการใช้งานนี้ทั้งหมด หากท่านไม่ยอมรับ กรุณาหยุดใช้งานแพลตฟอร์ม</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. การลงทะเบียนและบัญชีผู้ใช้</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการลงทะเบียน</li>
              <li>ผู้ใช้มีหน้าที่รักษาความปลอดภัยของบัญชีและรหัสผ่าน</li>
              <li>ห้ามใช้บัญชีผู้อื่นหรือมอบบัญชีให้ผู้อื่นโดยไม่ได้รับอนุญาต</li>
              <li>แพลตฟอร์มขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดข้อกำหนด</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. บริการของแพลตฟอร์ม</h2>
            <p>Sellio ให้บริการ:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>หน้าร้านค้าออนไลน์สำหรับ Creator</li>
              <li>ระบบจัดการสินค้าดิจิทัล การจอง และลิงก์</li>
              <li>ระบบชำระเงินผ่าน PromptPay QR และการโอนธนาคาร</li>
              <li>ระบบจัดการออเดอร์ ลูกค้า และสถิติ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. แพลนและการชำระเงิน</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free:</strong> ใช้งานฟรี จำกัด 2 สินค้า</li>
              <li><strong>Pro (99 บาท/เดือน):</strong> สินค้าไม่จำกัด พร้อมฟีเจอร์ขั้นสูง</li>
              <li>การชำระเงิน Pro ผ่าน Stripe ตัดบัตรอัตโนมัติทุกเดือน</li>
              <li>สามารถยกเลิกได้ตลอดเวลา จะยังใช้ Pro ได้จนถึงวันหมดอายุ</li>
              <li>ไม่มีนโยบายคืนเงินหลังจากเริ่มรอบบิล</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. การชำระเงินระหว่าง Creator และลูกค้า</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>การชำระเงินระหว่าง Creator และลูกค้าเป็นความรับผิดชอบของทั้งสองฝ่าย</li>
              <li>Sellio เป็นเพียงแพลตฟอร์มตัวกลาง ไม่รับผิดชอบข้อพิพาทเรื่องสินค้า/บริการ</li>
              <li>Creator มีหน้าที่ส่งมอบสินค้า/บริการตามที่ตกลงกับลูกค้า</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. เนื้อหาที่ห้าม</h2>
            <p>ห้ามใช้แพลตฟอร์มเพื่อขายหรือเผยแพร่:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>เนื้อหาที่ผิดกฎหมายหรือละเมิดลิขสิทธิ์</li>
              <li>เนื้อหาที่หลอกลวงหรือเป็นเท็จ</li>
              <li>เนื้อหาที่เป็นอันตรายต่อผู้อื่น</li>
              <li>เนื้อหาลามกอนาจารหรือไม่เหมาะสม</li>
              <li>สินค้าที่ผิดกฎหมายไทย</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. ทรัพย์สินทางปัญญา</h2>
            <p>Creator เป็นเจ้าของเนื้อหาที่อัปโหลด แต่อนุญาตให้ Sellio แสดงผลเนื้อหาดังกล่าวบนแพลตฟอร์มเพื่อวัตถุประสงค์ในการให้บริการ</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. การจำกัดความรับผิด</h2>
            <p>Sellio ให้บริการ &quot;ตามสภาพ&quot; (as-is) โดยไม่รับประกันว่าบริการจะไม่หยุดชะงักหรือปราศจากข้อผิดพลาด Sellio จะไม่รับผิดชอบต่อความเสียหายทางอ้อมที่เกิดจากการใช้งาน</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. การเปลี่ยนแปลงข้อกำหนด</h2>
            <p>Sellio ขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดการใช้งานได้ตลอดเวลา โดยจะแจ้งให้ผู้ใช้ทราบผ่านแพลตฟอร์มหรืออีเมล</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. กฎหมายที่ใช้บังคับ</h2>
            <p>ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ จะอยู่ภายใต้เขตอำนาจศาลไทย</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. ติดต่อเรา</h2>
            <p>หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อ:</p>
            <p className="mt-2"><strong>Email:</strong> support@trysellio.com</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
