'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, CalendarCheck, BarChart2, MessageSquare, Users, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent } from '@/components/ui/card'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

const features = [
  { icon: CalendarCheck, label: 'Agenda y turnos online' },
  { icon: BarChart2,     label: 'Reportes y estadísticas' },
  { icon: MessageSquare, label: 'Notificaciones automáticas' },
  { icon: Users,         label: 'Gestión de clientes' },
]

function getSubdominio(): string | null {
  if (typeof window === 'undefined') return null
  const parts = window.location.hostname.split('.')
  if (parts.length >= 3 && !parts.slice(-2).join('.').match(/vercel\.app|localhost/)) return parts[0]
  const b = new URLSearchParams(window.location.search).get('b')
  if (b) return b
  return process.env.NEXT_PUBLIC_DEV_SUBDOMINIO ?? null
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ correo_electronico: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [barberia, setBarberia] = useState<{ nombre_negocio: string; logo_url?: string | null } | null>(null)

  useEffect(() => {
    const sub = getSubdominio()
    if (!sub) return
    const url = `${BACKEND_URL}/api/public/barberia?subdominio=${sub}`
    fetch(url).then(r => r.ok ? r.json() : null).then(d => { if (d?.nombre_negocio) setBarberia(d) }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { rol } = await authApi.login(form)
      router.push(rol === 'barbero' ? '/barbero' : '/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between bg-zinc-950 dark:bg-zinc-900 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary overflow-hidden">
            {barberia?.logo_url
              ? <img src={barberia.logo_url} alt={barberia.nombre_negocio} className="size-10 object-cover" />
              : <Scissors className="size-5 text-black" />
            }
          </div>
          <span className="text-lg font-medium text-white">{barberia?.nombre_negocio ?? 'BarberSystem'}</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-medium text-white leading-snug">
              Gestioná tu barbería<br />de forma simple.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Todo lo que necesitás para administrar turnos, clientes y tu equipo en un solo lugar.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="size-4 text-primary shrink-0" />
                <span className="text-sm text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} {barberia?.nombre_negocio ?? 'BarberSystem'}</p>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm">
        <CardContent className="pt-8 space-y-8">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center justify-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary overflow-hidden">
              {barberia?.logo_url
                ? <img src={barberia.logo_url} alt={barberia.nombre_negocio} className="size-9 object-cover" />
                : <Scissors className="size-4 text-black" />
              }
            </div>
            <span className="text-base font-medium">{barberia?.nombre_negocio ?? 'BarberSystem'}</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-medium text-foreground">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">Accedé al panel de tu barbería</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@barberia.com"
                value={form.correo_electronico}
                onChange={e => setForm({ ...form, correo_electronico: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/recuperar-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

        </CardContent>
        </Card>
      </div>
    </div>
  )
}
