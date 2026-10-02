'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { PanelBloqueado } from '@/components/panel-bloqueado'

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
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    const rol = getRol()
    if (!rol) {
      router.replace('/login')
    } else if (rol === 'barbero') {
      router.replace('/barbero')
    } else if (rol === 'admin' || rol === 'owner') {
      // El rol sale del JWT, que es local: no sabe si la cuenta fue suspendida.
      // Se confirma contra el backend antes de mostrar el panel, para que no
      // aparezca un instante y después se reemplace.
      api.get('/mi-barberia')
        .then(() => setVerificado(true))
        .catch((e: Error & { suspendida?: boolean }) => {
          // Ante cualquier otro error se deja entrar: cada página maneja sus
          // propios fallos y no conviene dejar el panel en blanco por una
          // caída de red.
          if (e.suspendida) setBloqueado(true)
          else setVerificado(true)
        })
    } else {
      router.replace('/login')
    }
  }, [router])

  if (bloqueado) return <PanelBloqueado />
  if (!verificado) return null

  return <>{children}</>
}
