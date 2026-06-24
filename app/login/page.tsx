'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, CalendarCheck, BarChart2, MessageSquare, Users, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: CalendarCheck, label: 'Agenda y turnos online' },
  { icon: BarChart2,     label: 'Reportes y estadísticas' },
  { icon: MessageSquare, label: 'Notificaciones automáticas' },
  { icon: Users,         label: 'Gestión de clientes' },
]

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ correo_electronico: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
            <Scissors className="size-5 text-black" />
          </div>
          <span className="text-lg font-medium text-white">BarberSystem</span>
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

        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} BarberSystem</p>
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
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
              <Scissors className="size-4 text-black" />
            </div>
            <span className="text-base font-medium">BarberSystem</span>
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">¿No tenés cuenta?</span>
            </div>
          </div>

          <Link
            href="/registro"
            className="flex w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Registrá tu barbería
          </Link>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
