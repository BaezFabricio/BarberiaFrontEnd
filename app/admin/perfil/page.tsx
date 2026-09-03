'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, Lock, CheckCircle, User, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

type Perfil = {
  idusuario: number
  rol: string
  nombre_completo: string
  telefono: string
  correo_electronico: string
  foto_url?: string | null
}

type Estado = { tipo: 'exito' | 'error'; mensaje: string } | null

export default function PerfilAdmin() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loadingFoto, setLoadingFoto] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)

  // Datos personales
  const [datosForm, setDatosForm] = useState({ nombre_completo: '', telefono: '', correo_electronico: '' })
  const [loadingDatos, setLoadingDatos] = useState(false)
  const [estadoDatos, setEstadoDatos] = useState<Estado>(null)

  // Contraseña
  const [passForm, setPassForm] = useState({ password_actual: '', password_nueva: '', confirmar: '' })
  const [loadingPass, setLoadingPass] = useState(false)
  const [estadoPass, setEstadoPass] = useState<Estado>(null)

  useEffect(() => {
    api.get<Perfil>('/mi-perfil').then(p => {
      setPerfil(p)
      setDatosForm({ nombre_completo: p.nombre_completo ?? '', telefono: p.telefono ?? '', correo_electronico: p.correo_electronico ?? '' })
    }).catch(() => {})
  }, [])

  const iniciales = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

  const handleFoto = async (file: File) => {
    setLoadingFoto(true)
    try {
      const fd = new FormData()
      fd.append('imagen', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mi-perfil/foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir foto.')
      setPerfil(p => p ? { ...p, foto_url: data.foto_url } : p)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir foto.')
    } finally {
      setLoadingFoto(false)
    }
  }

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstadoDatos(null)
    if (!datosForm.nombre_completo.trim()) return setEstadoDatos({ tipo: 'error', mensaje: 'El nombre es obligatorio.' })
    setLoadingDatos(true)
    try {
      await api.put('/mi-perfil', { nombre_completo: datosForm.nombre_completo, telefono: datosForm.telefono, correo_electronico: datosForm.correo_electronico })
      setPerfil(p => p ? { ...p, nombre_completo: datosForm.nombre_completo, telefono: datosForm.telefono, correo_electronico: datosForm.correo_electronico } : p)
      setEstadoDatos({ tipo: 'exito', mensaje: 'Datos actualizados correctamente.' })
    } catch (err) {
      setEstadoDatos({ tipo: 'error', mensaje: err instanceof Error ? err.message : 'Error al guardar.' })
    } finally {
      setLoadingDatos(false)
    }
  }

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstadoPass(null)
    if (passForm.password_nueva !== passForm.confirmar)
      return setEstadoPass({ tipo: 'error', mensaje: 'Las contraseñas nuevas no coinciden.' })
    if (passForm.password_nueva.length < 6)
      return setEstadoPass({ tipo: 'error', mensaje: 'La contraseña nueva debe tener al menos 6 caracteres.' })
    setLoadingPass(true)
    try {
      await api.put('/mi-perfil/password', { password_actual: passForm.password_actual, password_nueva: passForm.password_nueva })
      setEstadoPass({ tipo: 'exito', mensaje: 'Contraseña actualizada correctamente.' })
      setPassForm({ password_actual: '', password_nueva: '', confirmar: '' })
    } catch (err) {
      setEstadoPass({ tipo: 'error', mensaje: err instanceof Error ? err.message : 'Error al cambiar contraseña.' })
    } finally {
      setLoadingPass(false) }
  }

  return (
    <>
      <AdminHeader title="Mi Perfil" description="Administrá tu cuenta y seguridad" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {!perfil ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">

            {/* Foto + nombre */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  {/* Avatar clicable */}
                  <div className="relative shrink-0">
                    <Avatar className="size-24 border-2 border-muted">
                      {perfil.foto_url
                        ? <AvatarImage src={perfil.foto_url} alt={perfil.nombre_completo} className="object-cover" />
                        : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {iniciales(perfil.nombre_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      title="Cambiar foto"
                      onClick={() => fotoRef.current?.click()}
                      disabled={loadingFoto}
                      className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      {loadingFoto
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Camera className="size-3.5" />}
                    </button>
                    <input
                      ref={fotoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleFoto(e.target.files[0])}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h2 className="text-xl font-semibold">{perfil.nombre_completo}</h2>
                      <Badge variant="secondary" className="capitalize">{perfil.rol}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center justify-center gap-2 sm:justify-start">
                        <Mail className="size-3.5" />{perfil.correo_electronico}
                      </p>
                      {perfil.telefono && (
                        <p className="flex items-center justify-center gap-2 sm:justify-start">
                          <Phone className="size-3.5" />{perfil.telefono}
                        </p>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Hacé clic en el ícono de cámara para cambiar la foto de perfil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos personales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4" />Datos personales
                </CardTitle>
                <CardDescription>Actualizá tu nombre y teléfono de contacto</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGuardarDatos} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      placeholder="Tu nombre y apellido"
                      value={datosForm.nombre_completo}
                      onChange={e => setDatosForm(p => ({ ...p, nombre_completo: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      placeholder="Ej: +54 9 381 000-0000"
                      value={datosForm.telefono}
                      onChange={e => setDatosForm(p => ({ ...p, telefono: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="correo">Correo electrónico</Label>
                    <Input
                      id="correo"
                      type="email"
                      placeholder="tu@correo.com"
                      value={datosForm.correo_electronico}
                      onChange={e => setDatosForm(p => ({ ...p, correo_electronico: e.target.value }))}
                    />
                  </div>
                  <AlertaBanner estado={estadoDatos} />
                  <Button type="submit" disabled={loadingDatos}>
                    {loadingDatos ? <><Loader2 className="mr-2 size-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Separator />

            {/* Contraseña */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="size-4" />Cambiar contraseña
                </CardTitle>
                <CardDescription>Para cambiar la contraseña necesitás ingresar la actual primero</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCambiarPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Contraseña actual</Label>
                    <Input
                      type="password"
                      placeholder="Tu contraseña actual"
                      value={passForm.password_actual}
                      onChange={e => setPassForm(p => ({ ...p, password_actual: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Contraseña nueva</Label>
                      <Input
                        type="password"
                        placeholder="Mín. 6 caracteres"
                        value={passForm.password_nueva}
                        onChange={e => setPassForm(p => ({ ...p, password_nueva: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirmar contraseña</Label>
                      <Input
                        type="password"
                        placeholder="Repetí la nueva contraseña"
                        value={passForm.confirmar}
                        onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <AlertaBanner estado={estadoPass} />
                  <Button type="submit" disabled={loadingPass}>
                    {loadingPass ? <><Loader2 className="mr-2 size-4 animate-spin" />Cambiando...</> : 'Cambiar contraseña'}
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </>
  )
}

function AlertaBanner({ estado }: { estado: Estado }) {
  if (!estado) return null
  const esExito = estado.tipo === 'exito'
  return (
    <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      esExito ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'
    }`}>
      {esExito ? <CheckCircle className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
      {estado.mensaje}
    </p>
  )
}
