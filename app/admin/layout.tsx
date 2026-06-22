import { AdminLayout } from '@/components/admin/admin-layout'
import { AuthGuard } from '@/components/admin/auth-guard'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}
