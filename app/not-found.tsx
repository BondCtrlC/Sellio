import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center px-4">
        <div className="mb-6">
          <span className="text-7xl font-bold text-gray-200">404</span>
        </div>
        <FileQuestion className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">ไม่พบหน้าที่คุณกำลังมองหา</h1>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          หน้านี้อาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ กรุณาตรวจสอบ URL อีกครั้ง
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
