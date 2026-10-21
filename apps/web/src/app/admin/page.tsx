import type { Metadata } from 'next';
import AdminPanel from '@/app/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Player records · Cosmoids Admin',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
