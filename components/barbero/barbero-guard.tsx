'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function BarberoGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.rol === 'admin') { router.replace('/admin'); return }
      if (payload.rol !== 'barbero') { router.replace('/login'); return }
      setVerificado(true)
    } catch {
      router.replace('/login')
    }
  }, [router])

  if (!verificado) return null
  return <>{children}</>
}
