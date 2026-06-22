'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, Phone, Mail, Lock, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

type Perfil = {
  idusuario: number
  rol: string
  rating_promedio: number
  comision_porcentaje: number
  nombre_completo: string
  telefono: string
  correo_electronico: string
}

export default function PerfilBarbero() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [form, setForm] = useState({ password_actual: '', password_nueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    api.get<Perfil>('/mi-perfil').then(setPerfil).catch(() => {})
  }, [])

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setExito(false)
    if (form.password_nueva !== form.confirmar) return setError('Las contraseñas nuevas no coinciden.')
    if (form.password_nueva.length < 6) return setError('La contraseña nueva debe tener al menos 6 caracteres.')
    setLoading(true)
    try {
      await api.put('/mi-perfil/password', { password_actual: form.password_actual, password_nueva: form.password_nueva })
      setExito(true)
      setForm({ password_actual: '', password_nueva: '', confirmar: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña.')
    } finally { setLoading(false) }
  }

  const iniciales = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

  if (!perfil) return <div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Tu información y configuración</p>
      </div>

      {/* Info personal */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {iniciales(perfil.nombre_completo)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{perfil.nombre_completo}</h2>
              <Badge variant="secondary">{perfil.rol}</Badge>
            </div>
            <div className="mt-1 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="size-3.5" />{perfil.correo_electronico}</p>
              <p className="flex items-center gap-2"><Phone className="size-3.5" />{perfil.telefono}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="size-4 fill-primary text-primary" />
              <span className="text-2xl font-bold">{Number(perfil.rating_promedio).toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rating promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-bold">{perfil.comision_porcentaje}%</span>
            <p className="text-xs text-muted-foreground mt-1">Comisión</p>
          </CardContent>
        </Card>
      </div>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" />Cambiar contraseña
          </CardTitle>
          <CardDescription>Actualizá tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Contraseña actual</Label>
              <Input type="password" placeholder="Tu contraseña actual" value={form.password_actual}
                onChange={e => setForm(p => ({ ...p, password_actual: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña nueva</Label>
              <Input type="password" placeholder="Mín. 6 caracteres" value={form.password_nueva}
                onChange={e => setForm(p => ({ ...p, password_nueva: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar contraseña nueva</Label>
              <Input type="password" placeholder="Repetí la contraseña" value={form.confirmar}
                onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))} required />
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {exito && (
              <p className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600">
                <CheckCircle className="size-4" />Contraseña actualizada correctamente
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
