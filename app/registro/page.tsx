'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Scissors, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi, type RegistroPayload } from '@/lib/api'

const pasos = ['Tu barbería', 'Tus datos', 'Acceso']

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<RegistroPayload>({
    nombre_negocio: '',
    subdominio: '',
    nombre_completo: '',
    telefono: '',
    correo_electronico: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')

  const set = (campo: keyof RegistroPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value
    if (campo === 'subdominio') valor = valor.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const siguiente = () => {
    setError('')
    if (paso === 0 && (!form.nombre_negocio || !form.subdominio)) {
      return setError('Completá el nombre y el subdominio.')
    }
    if (paso === 1 && (!form.nombre_completo || !form.telefono || !form.correo_electronico)) {
      return setError('Completá todos tus datos.')
    }
    setPaso(p => p + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.password || form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (form.password !== confirmPassword) return setError('Las contraseñas no coinciden.')
    setLoading(true)
    try {
      await authApi.registro(form)
      await authApi.login({ correo_electronico: form.correo_electronico, password: form.password })
      router.push('/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Scissors className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Registrá tu barbería</CardTitle>
          <CardDescription>Creá tu cuenta gratis en minutos</CardDescription>

          {/* Stepper */}
          <div className="mt-4 flex items-center gap-2">
            {pasos.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  paso > i ? 'bg-primary text-primary-foreground'
                  : paso === i ? 'border-2 border-primary text-primary'
                  : 'bg-muted text-muted-foreground'
                }`}>
                  {paso > i ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className={`text-xs ${paso === i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
                {i < pasos.length - 1 && <div className={`h-px w-6 ${paso > i ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={paso === 2 ? handleSubmit : (e) => { e.preventDefault(); siguiente() }} className="space-y-4">

            {/* Paso 0: Datos de la barbería */}
            {paso === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_negocio">Nombre del negocio</Label>
                  <Input id="nombre_negocio" placeholder="Barber Studio" value={form.nombre_negocio} onChange={set('nombre_negocio')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subdominio">Subdominio</Label>
                  <div className="flex items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    <Input
                      id="subdominio"
                      placeholder="barberstudio"
                      value={form.subdominio}
                      onChange={set('subdominio')}
                      className="border-0 bg-transparent p-0 focus-visible:ring-0"
                      required
                    />
                    <span className="text-muted-foreground">.tuapp.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones.</p>
                </div>
              </>
            )}

            {/* Paso 1: Datos del dueño */}
            {paso === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_completo">Tu nombre completo</Label>
                  <Input id="nombre_completo" placeholder="Juan Pérez" value={form.nombre_completo} onChange={set('nombre_completo')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" placeholder="+54 11 1234-5678" value={form.telefono} onChange={set('telefono')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="correo_electronico">Correo electrónico</Label>
                  <Input id="correo_electronico" type="email" placeholder="tu@email.com" value={form.correo_electronico} onChange={set('correo_electronico')} required />
                </div>
              </>
            )}

            {/* Paso 2: Contraseña */}
            {paso === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Repetir contraseña</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </>
            )}

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              {paso > 0 && (
                <Button type="button" variant="outline" className="flex-1" onClick={() => setPaso(p => p - 1)}>
                  Atrás
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {paso < 2 ? 'Siguiente' : loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline">Iniciá sesión</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
