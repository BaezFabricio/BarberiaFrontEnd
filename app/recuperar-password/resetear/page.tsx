'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

function ResetearForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ password_nueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => { if (!token) setError('Token inválido o expirado.') }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password_nueva !== form.confirmar) { setError('Las contraseñas no coinciden.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/resetear-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password_nueva: form.password_nueva }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExito(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Scissors className="size-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Nueva contraseña</CardTitle>
          <CardDescription>Ingresá tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          {exito ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">¡Contraseña actualizada! Redirigiendo al login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nueva contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password_nueva}
                  onChange={e => setForm(p => ({ ...p, password_nueva: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmar}
                  onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:underline">Volver al login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetearPage() {
  return (
    <Suspense>
      <ResetearForm />
    </Suspense>
  )
}
