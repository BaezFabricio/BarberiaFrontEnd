'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

function getRol(): string | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    return JSON.parse(atob(token.split('.')[1])).rol ?? null
  } catch { return null }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verificado, setVerificado] = useState(false)

  useEffect(() => {
    const rol = getRol()
    if (!rol) {
      router.replace('/login')
    } else if (rol === 'barbero') {
      router.replace('/barbero')
    } else if (rol === 'admin' || rol === 'owner') {
      // El rol sale del JWT, que es local: no sabe si la cuenta fue suspendida.
      // Se confirma contra el backend antes de mostrar el panel, para que no
      // aparezca un instante y después salte a /bloqueado.
      api.get('/mi-barberia')
        .then(() => setVerificado(true))
        .catch((e: Error & { suspendida?: boolean }) => {
          // Si está suspendida, apiRequest ya está navegando a /bloqueado y no
          // hay que renderizar nada. Ante cualquier otro error se deja entrar:
          // cada página maneja sus propios fallos.
          if (!e.suspendida) setVerificado(true)
        })
    } else {
      router.replace('/login')
    }
  }, [router])

  if (!verificado) return null

  return <>{children}</>
}
