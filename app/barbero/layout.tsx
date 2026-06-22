import { BarberoGuard } from '@/components/barbero/barbero-guard'
import { BarberoLayout } from '@/components/barbero/barbero-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BarberoGuard>
      <BarberoLayout>{children}</BarberoLayout>
    </BarberoGuard>
  )
}
