import type { ReactNode } from 'react';
import { AppShell } from '@/components/product/app-shell';
import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell requireAdmin>
      <div className="space-y-6">
        <AdminNav />
        {children}
      </div>
    </AppShell>
  );
}
