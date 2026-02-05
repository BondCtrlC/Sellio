import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { ProductForm } from '../product-form';

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">เพิ่มสินค้าใหม่</h2>
        <p className="text-muted-foreground">สร้างสินค้าหรือบริการใหม่สำหรับร้านค้าของคุณ</p>
      </div>

      {/* Steps Indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</span>
          <span className="font-medium">ข้อมูลสินค้า</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">2</span>
          <span>อัปโหลด/ตั้งค่า</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</span>
          <span>เสร็จสิ้น</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
          <CardDescription>กรอกรายละเอียดสินค้าของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
