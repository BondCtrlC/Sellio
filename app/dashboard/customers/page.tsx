import { redirect } from 'next/navigation';
import { getCustomers } from '@/actions/customers';
import { CustomersList } from './customers-list';

export default async function CustomersPage() {
  const result = await getCustomers();
  
  if (!result.success && result.error === 'กรุณาเข้าสู่ระบบ') {
    redirect('/login');
  }

  return <CustomersList initialCustomers={result.customers} />;
}
