import type { ReactNode } from 'react';
import AdminProvider from '../../components/admin-provider';
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
