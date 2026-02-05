import Link from 'next/link';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center px-4">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ไม่พบสินค้า</h1>
        <p className="text-muted-foreground mb-6">
          สินค้านี้อาจไม่มีอยู่หรือยังไม่เปิดขาย
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
