'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export function BarberoGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.replace('/login'); return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.rol !== 'barbero' && payload.rol !== 'owner' && payload.rol !== 'admin') { router.replace('/login'); return }
      // El rol sale del JWT, que es local: no sabe si la cuenta fue suspendida.
      // Se confirma contra el backend antes de mostrar el panel, para que no
      // aparezca un instante y después salte a /bloqueado.
      api.get('/mi-barberia')
        .then(() => setVerificado(true))
        .catch((e: Error & { suspendida?: boolean }) => {
          if (!e.suspendida) setVerificado(true)
        })
    } catch {
      router.replace('/login')
    }
  }, [router])

  if (!verificado) return null
  return <>{children}</>
}
