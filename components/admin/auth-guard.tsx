'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    } else if (rol === 'admin') {
      setVerificado(true)
    } else {
      router.replace('/login')
    }
  }, [router])

  if (!verificado) return null

  return <>{children}</>
}
