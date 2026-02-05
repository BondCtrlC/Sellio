import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui';
import { ProductForm } from '../../product-form';
import { ProductImageUpload } from './product-image-upload';
import { DigitalFileUpload } from './digital-file-upload';
import { BookingSlotsManager } from './booking-slots-manager';
import { BookingSettings } from './booking-settings';
import { CheckCircle } from 'lucide-react';

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ new?: string }>;
}

type SlotData = {
  id: string;
  slot_date: string;
  start_time: string;
  max_bookings: number;
  current_bookings: number;
  end_time: string;
  is_available: boolean;
  is_booked: boolean;
};

async function getProduct(productId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('creator_id', creator.id)
    .single();

  // Get slots for booking/live products
  let slots: SlotData[] = [];
  
  if (product && (product.type === 'booking' || product.type === 'live')) {
    const today = new Date().toISOString().split('T')[0];
    const { data: slotsData } = await supabase
      .from('booking_slots')
      .select('id, slot_date, start_time, end_time, is_available, is_booked, max_bookings, current_bookings')
      .eq('product_id', productId)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    slots = slotsData || [];
  }

  return { product, slots, creatorId: creator.id };
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const { productId } = await params;
  const { new: isNewProduct } = await searchParams;
  const { product, slots, creatorId } = await getProduct(productId);

  if (!product) {
    notFound();
  }

  // Get settings from type_config
  const typeConfig = (product.type_config as Record<string, unknown>) || {};
  const digitalFileUrl = typeConfig.digital_file_url as string | null;
  const digitalFileName = typeConfig.digital_file_name as string | null;
  const deliveryType = (typeConfig.delivery_type as 'file' | 'redirect') || 'file';
  const redirectUrl = typeConfig.redirect_url as string | null;
  const redirectName = typeConfig.redirect_name as string | null;
  const durationMinutes = (typeConfig.duration_minutes as number) || 60;
  const minimumAdvanceHours = (typeConfig.minimum_advance_hours as number) || 0;
  const bufferMinutes = (typeConfig.buffer_minutes as number) || 0;
  
  // Check if need to show upload/slots section
  const needsSetup = product.type === 'digital' || product.type === 'booking' || product.type === 'link';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isNewProduct ? 'ตั้งค่าสินค้า' : 'แก้ไขสินค้า'}
        </h2>
        <p className="text-muted-foreground">
          {isNewProduct && needsSetup
            ? product.type === 'digital'
              ? 'อัปโหลดไฟล์ที่จะส่งให้ลูกค้า'
              : product.type === 'booking'
              ? 'เพิ่มวัน/เวลาที่คุณว่างสำหรับให้ลูกค้าจอง'
              : 'อัปโหลดรูป Thumbnail'
            : 'แก้ไขรายละเอียดสินค้าของคุณ'}
        </p>
      </div>

      {/* Steps Indicator - Only for new products that need setup */}
      {isNewProduct && needsSetup && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
            <span>ข้อมูลสินค้า</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</span>
            <span className="font-medium">อัปโหลด/ตั้งค่า</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">3</span>
            <span>เสร็จสิ้น</span>
          </div>
        </div>
      )}

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>รูปสินค้า</CardTitle>
          <CardDescription>รูปที่จะแสดงในหน้าร้านค้า</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductImageUpload 
            productId={product.id} 
            currentImageUrl={product.image_url}
            productTitle={product.title}
          />
        </CardContent>
      </Card>

      {/* Digital File Upload - Only for digital products */}
      {product.type === 'digital' && (
        <Card>
          <CardHeader>
            <CardTitle>ไฟล์ดิจิทัล</CardTitle>
            <CardDescription>ไฟล์ที่จะส่งให้ลูกค้าหลังชำระเงิน หรือ URL ที่จะ redirect ไป</CardDescription>
          </CardHeader>
          <CardContent>
            <DigitalFileUpload
              productId={product.id}
              creatorId={creatorId}
              currentFileUrl={digitalFileUrl}
              currentFileName={digitalFileName}
              currentDeliveryType={deliveryType}
              currentRedirectUrl={redirectUrl}
              currentRedirectName={redirectName}
            />
          </CardContent>
        </Card>
      )}

      {/* Booking Settings - Only for booking products */}
      {product.type === 'booking' && (
        <Card>
          <CardHeader>
            <CardTitle>ตั้งค่าการจอง</CardTitle>
            <CardDescription>ตั้งค่าระยะเวลาและเงื่อนไขการจอง</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingSettings
              productId={product.id}
              initialMinimumAdvanceHours={minimumAdvanceHours}
              initialBufferMinutes={bufferMinutes}
            />
          </CardContent>
        </Card>
      )}

      {/* Booking Slots Manager - Only for booking products */}
      {product.type === 'booking' && (
        <Card>
          <CardHeader>
            <CardTitle>จัดการ Slot เวลา</CardTitle>
            <CardDescription>เพิ่มวัน/เวลาที่คุณว่างสำหรับให้ลูกค้าจอง</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingSlotsManager
              productId={product.id}
              durationMinutes={durationMinutes}
              initialSlots={slots}
            />
          </CardContent>
        </Card>
      )}

      {/* Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสินค้า</CardTitle>
          <CardDescription>แก้ไขรายละเอียดสินค้าของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} />
        </CardContent>
      </Card>

      {/* Finish Button - For new products */}
      {isNewProduct && needsSetup && (
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/dashboard/products">
            <Button size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              เสร็จสิ้น
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
