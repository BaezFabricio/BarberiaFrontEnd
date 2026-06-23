'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, MoreHorizontal, Pencil, Power, Clock, DollarSign, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { ImageUpload } from '@/components/ui/image-upload'
import Image from 'next/image'

type Servicio = {
  idservicio: number
  nombre_servicio: string
  descripcion: string | null
  precio: number
  duracion_minutos: number
  estado: 'activo' | 'inactivo'
  imagen_url?: string
}

const FORM_VACIO = { nombre_servicio: '', descripcion: '', precio: '', duracion_minutos: '' }

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    try {
      const data = await api.get<Servicio[]>('/servicios')
      setServicios(data)
    } catch { setServicios([]) }
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setError('')
    setModalAbierto(true)
  }

  const abrirEditar = (s: Servicio) => {
    setEditando(s)
    setForm({ nombre_servicio: s.nombre_servicio, descripcion: s.descripcion ?? '', precio: String(s.precio), duracion_minutos: String(s.duracion_minutos) })
    setError('')
    setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nombre_servicio || !form.precio || !form.duracion_minutos) {
      return setError('Nombre, precio y duración son obligatorios.')
    }
    if (Number(form.duracion_minutos) < 30) {
      return setError('La duración mínima es 30 minutos.')
    }
    setLoading(true)
    try {
      const payload = { ...form, precio: Number(form.precio), duracion_minutos: Number(form.duracion_minutos) }
      if (editando) {
        await api.put(`/servicios/${editando.idservicio}`, payload)
      } else {
        await api.post('/servicios', payload)
      }
      setModalAbierto(false)
      cargar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const toggleEstado = async (s: Servicio) => {
    await api.put(`/servicios/${s.idservicio}`, { estado: s.estado === 'activo' ? 'inactivo' : 'activo' })
    cargar()
  }

  const filtrados = servicios.filter(s =>
    s.nombre_servicio.toLowerCase().includes(busqueda.toLowerCase())
  )
  const activos = servicios.filter(s => s.estado === 'activo')
  const precioPromedio = activos.length ? activos.reduce((a, s) => a + Number(s.precio), 0) / activos.length : 0
  const duracionPromedio = activos.length ? activos.reduce((a, s) => a + s.duracion_minutos, 0) / activos.length : 0

  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

  return (
    <>
      <AdminHeader
        title="Servicios"
        description="Gestioná los servicios de tu barbería"
        actions={
          <Button className="gap-2" onClick={abrirCrear}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo Servicio</span>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Activos</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activos.length}</div>
              <p className="text-xs text-muted-foreground">de {servicios.length} registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Precio Promedio</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(precioPromedio)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Duración Promedio</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(duracionPromedio)} min</div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar servicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
        </div>

        {/* Grid */}
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay servicios todavía</p>
            <Button variant="outline" size="sm" onClick={abrirCrear}>
              <Plus className="mr-2 size-4" /> Crear primer servicio
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map(s => (
              <Card key={s.idservicio} className={s.estado === 'inactivo' ? 'opacity-60' : ''}>
                {s.imagen_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img src={s.imagen_url} alt={s.nombre_servicio} className="h-full w-full object-cover" />
                  </div>
                )}
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{s.nombre_servicio}</CardTitle>
                    {s.descripcion && <CardDescription className="line-clamp-2">{s.descripcion}</CardDescription>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => abrirEditar(s)}>
                        <Pencil className="mr-2 size-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleEstado(s)}>
                        <Power className="mr-2 size-4" /> {s.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-4" /> {s.duracion_minutos} min
                      </span>
                      <span className="font-semibold text-primary">{fmt(Number(s.precio))}</span>
                    </div>
                    <Badge variant={s.estado === 'activo' ? 'default' : 'secondary'}>
                      {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            {editando && (
              <ServicioImagenUpload
                servicio={editando}
                onSuccess={() => cargar()}
              />
            )}
            <div className="space-y-1.5">
              <Label htmlFor="nombre_servicio">Nombre</Label>
              <Input id="nombre_servicio" placeholder="Ej: Corte de cabello" value={form.nombre_servicio}
                onChange={e => setForm(p => ({ ...p, nombre_servicio: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea id="descripcion" placeholder="Describí el servicio..." rows={2} value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="precio">Precio ($)</Label>
                <Input id="precio" type="number" min="0" placeholder="3500" value={form.precio}
                  onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input id="duracion" type="number" min="30" placeholder="40" value={form.duracion_minutos}
                  onChange={e => setForm(p => ({ ...p, duracion_minutos: e.target.value }))} required />
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Upload de imagen para servicio ────────────────────────────────────────────
function ServicioImagenUpload({ servicio, onSuccess }: { servicio: Servicio; onSuccess: () => void }) {
  const [preview, setPreview] = useState<string | null>(servicio.imagen_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Solo imágenes.')
    if (file.size > 5 * 1024 * 1024) return setError('Máximo 5MB.')
    setError(''); setLoading(true)
    setPreview(URL.createObjectURL(file))
    try {
      const fd = new FormData(); fd.append('imagen', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/servicios/${servicio.idservicio}/imagen`, {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.imagen_url)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir.')
      setPreview(servicio.imagen_url ?? null)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <Label>Imagen del servicio</Label>
      <button type="button" onClick={() => inputRef.current?.click()}
        className="relative w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary"
        style={{ aspectRatio: '16/7' }}>
        {preview
          ? <img src={preview} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground py-8">
              <Package className="size-8 opacity-40" />
              <span className="text-sm">Hacé click para subir una imagen</span>
              <span className="text-xs opacity-60">JPG, PNG o WEBP · Máx 5MB</span>
            </div>
        }
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
