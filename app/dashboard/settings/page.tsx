import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { SettingsForm } from './settings-form';

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

      <Card>
        <CardContent className="p-6">
          <SettingsForm creator={creator} />
        </CardContent>
      </Card>
    </div>
  );
}
