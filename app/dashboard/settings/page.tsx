import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { SettingsForm } from './settings-form';
import { AvatarUpload } from './avatar-upload';

async function getCreator() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!creator) redirect('/login');

  return creator;
}

export default async function SettingsPage() {
  const creator = await getCreator();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">ตั้งค่า</h2>
        <p className="text-muted-foreground">จัดการโปรไฟล์และการตั้งค่าร้านค้าของคุณ</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>รูปโปรไฟล์</CardTitle>
          <CardDescription>รูปที่จะแสดงในหน้าร้านค้าของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload 
            currentAvatarUrl={creator.avatar_url} 
            displayName={creator.display_name}
          />
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
          <CardDescription>ข้อมูลที่จะแสดงในหน้าร้านค้า</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm creator={creator} />
        </CardContent>
      </Card>

      {/* Store Link */}
      <Card>
        <CardHeader>
          <CardTitle>ลิงก์ร้านค้า</CardTitle>
          <CardDescription>แชร์ลิงก์นี้ให้ลูกค้าของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="text-sm flex-1">
              {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/{creator.username}
            </code>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {creator.is_published 
              ? '✅ ร้านค้าเปิดให้บริการอยู่' 
              : '⚠️ ร้านค้ายังไม่เปิดให้บริการ กรุณาเปิดในแบบฟอร์มด้านบน'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
