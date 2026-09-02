'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, User, Globe } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { authApi, api } from '@/lib/api'
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'

type MiBarberia = { nombre_negocio: string; logo_url?: string | null; color_primario?: string }

export function BarberoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [barberia, setBarberia] = useState<MiBarberia | null>(null)

  useEffect(() => {
    aplicarColorGuardado()
    api.get<MiBarberia>('/mi-barberia').then(d => { setBarberia(d); if (d.color_primario) aplicarColor(d.color_primario, true) }).catch(() => {})
  }, [])

  const handleLogout = () => { authApi.logout(); router.push('/login') }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="flex h-12 items-center justify-between border-b border-border/50 px-4">
        <Link href="/barbero" className="flex items-center gap-2">
          <div className="flex h-7 items-center justify-center">
            {barberia?.logo_url
              ? <img src={barberia.logo_url} alt={barberia.nombre_negocio} className="h-7 w-auto max-w-[40px] object-contain" />
              : <div className="flex size-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">B</div>
            }
          </div>
          <span className="text-sm font-semibold">
            {(barberia?.nombre_negocio ?? 'Barber Studio').split(' ')[0]}{' '}
            <span className="text-primary">{(barberia?.nombre_negocio ?? 'Barber Studio').split(' ').slice(1).join(' ')}</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
              <Settings className="size-3.5" />
              Portal Barbero
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/"><Globe className="mr-2 size-4" />Ver sitio web</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/barbero/perfil"><User className="mr-2 size-4" />Mi Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 size-4" />Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
