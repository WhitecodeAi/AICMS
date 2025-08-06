'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import ClientMenuBuilder from '@/components/admin/ClientMenuBuilder'

export default function MenusPage() {
  return (
    <AdminLayout>
      <ClientMenuBuilder />
    </AdminLayout>
  )
}
