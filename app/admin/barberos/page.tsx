'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, MoreHorizontal, Power, Users, Star, Clock, X, Pencil, Trash2, KeyRound } from 'lucide-react'
import { api } from '@/lib/api'
import { ImageUpload } from '@/components/ui/image-upload'
import Image from 'next/image'

type Barbero = {
  idusuario: number
  rol: string
  rating_promedio: number
  comision_porcentaje: number
  puede_cobrar?: boolean
  puede_vender?: boolean
  estado?: string
  especialidades?: string
  persona: { nombre_completo: string; telefono: string; correo_electronico: string; foto_url?: string }
}

type Horario = { idhorario?: number; dia_semana: number; hora_apertura: string; hora_cierre: string }

const DIAS = [
  { num: 1, label: 'Lunes' },
  { num: 2, label: 'Martes' },
  { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves' },
  { num: 5, label: 'Viernes' },
  { num: 6, label: 'Sábado' },
  { num: 7, label: 'Domingo' },
]

type Rango = { hora_apertura: string; hora_cierre: string }
type DiaConfig = { activo: boolean; rangos: Rango[] }
type HorariosEditor = Record<number, DiaConfig>

function initEditor(horarios: Horario[]): HorariosEditor {
  const map: HorariosEditor = {}
  DIAS.forEach(d => {
    const rangosDelDia = horarios
      .filter(h => h.dia_semana === d.num)
      .map(h => ({ hora_apertura: h.hora_apertura.slice(0, 5), hora_cierre: h.hora_cierre.slice(0, 5) }))
    map[d.num] = rangosDelDia.length > 0
      ? { activo: true, rangos: rangosDelDia }
      : { activo: false, rangos: [{ hora_apertura: '09:00', hora_cierre: '19:00' }] }
  })
  return map
}

const FORM_VACIO = { nombre_completo: '', correo_electronico: '', telefono: '', password: '', comision_porcentaje: '' }

export default function BarberosPage() {
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [horariosBarbero, setHorariosBarbero] = useState<Barbero | null>(null)
  const [modalHorarios, setModalHorarios] = useState(false)
  const [editor, setEditor] = useState<HorariosEditor>({})
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [errorHorarios, setErrorHorarios] = useState('')

  const [fotoBarbero, setFotoBarbero] = useState<Barbero | null>(null)
  const [modalFoto, setModalFoto] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')

  const [editBarbero, setEditBarbero] = useState<Barbero | null>(null)
  const [modalEditar, setModalEditar] = useState(false)
  const [formEditar, setFormEditar] = useState({ nombre_completo: '', telefono: '', correo_electronico: '', comision_porcentaje: '', puede_cobrar: false, puede_vender: false, especialidades: '' })
  const [loadingEditar, setLoadingEditar] = useState(false)
  const [errorEditar, setErrorEditar] = useState('')

  const [eliminarBarbero, setEliminarBarbero] = useState<Barbero | null>(null)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

  const [passBarb, setPassBarb] = useState<Barbero | null>(null)
  const [modalPass, setModalPass] = useState(false)
  const [nuevaPass, setNuevaPass] = useState('')
  const [loadingPass, setLoadingPass] = useState(false)
  const [errorPass, setErrorPass] = useState('')

  const cargar = async () => {
    try { setBarberos(await api.get<Barbero[]>('/barberos')) } catch { setBarberos([]) }
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => { setForm(FORM_VACIO); setError(''); setModalAbierto(true) }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nombre_completo || !form.correo_electronico || !form.telefono || !form.password)
      return setError('Todos los campos obligatorios deben estar completos.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setLoading(true)
    try {
      await api.post('/barberos', { ...form, comision_porcentaje: form.comision_porcentaje ? Number(form.comision_porcentaje) : 0 })
      setModalAbierto(false)
      cargar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally { setLoading(false) }
  }

  const toggleEstado = async (b: Barbero) => {
    const nuevoEstado = (b.estado ?? 'activo') === 'activo' ? 'inactivo' : 'activo'
    await api.patch(`/barberos/${b.idusuario}/estado`, { estado: nuevoEstado })
    cargar()
  }

  const confirmarEliminar = async () => {
    if (!eliminarBarbero) return
    setLoadingEliminar(true)
    try {
      await api.delete(`/barberos/${eliminarBarbero.idusuario}`)
      setModalEliminar(false)
      cargar()
    } catch { } finally { setLoadingEliminar(false) }
  }

  const cambiarPassword = async () => {
    if (!passBarb || nuevaPass.length < 6) return setErrorPass('La contraseña debe tener al menos 6 caracteres.')
    setLoadingPass(true); setErrorPass('')
    try {
      await api.patch(`/barberos/${passBarb.idusuario}/password`, { password: nuevaPass })
      setModalPass(false); setNuevaPass('')
    } catch (e: unknown) { setErrorPass(e instanceof Error ? e.message : 'Error') }
    finally { setLoadingPass(false) }
  }

  const abrirHorarios = async (b: Barbero) => {
    setHorariosBarbero(b)
    setErrorHorarios('')
    setModalHorarios(true)
    setLoadingHorarios(true)
    try {
      const data = await api.get<Horario[]>(`/barberos/${b.idusuario}/horarios`)
      setEditor(initEditor(data))
    } catch { setEditor(initEditor([])) }
    finally { setLoadingHorarios(false) }
  }

  const handleGuardarHorarios = async () => {
    if (!horariosBarbero) return
    setErrorHorarios('')
    // Validar que hora_apertura < hora_cierre en todos los rangos activos
    for (const d of DIAS) {
      const dia = editor[d.num]
      if (!dia?.activo) continue
      for (const r of dia.rangos) {
        if (r.hora_apertura >= r.hora_cierre)
          return setErrorHorarios(`${d.label}: la hora de inicio debe ser menor que la de fin.`)
      }
    }
    setLoadingHorarios(true)
    try {
      const payload: Horario[] = []
      DIAS.forEach(d => {
        const dia = editor[d.num]
        if (dia?.activo) {
          dia.rangos.forEach(r => payload.push({ dia_semana: d.num, hora_apertura: r.hora_apertura, hora_cierre: r.hora_cierre }))
        }
      })
      await api.put(`/barberos/${horariosBarbero.idusuario}/horarios`, payload)
      setModalHorarios(false)
    } catch (err: unknown) {
      setErrorHorarios(err instanceof Error ? err.message : 'Error al guardar.')
    } finally { setLoadingHorarios(false) }
  }

  const toggleDia = (dia: number, activo: boolean) => {
    setEditor(prev => ({ ...prev, [dia]: { ...prev[dia], activo } }))
  }

  const setRango = (dia: number, idx: number, field: keyof Rango, value: string) => {
    setEditor(prev => {
      const rangos = [...prev[dia].rangos]
      rangos[idx] = { ...rangos[idx], [field]: value }
      return { ...prev, [dia]: { ...prev[dia], rangos } }
    })
  }

  const agregarRango = (dia: number) => {
    setEditor(prev => {
      const ultimo = prev[dia].rangos[prev[dia].rangos.length - 1]
      return {
        ...prev,
        [dia]: { ...prev[dia], rangos: [...prev[dia].rangos, { hora_apertura: ultimo.hora_cierre, hora_cierre: '20:00' }] }
      }
    })
  }

  const quitarRango = (dia: number, idx: number) => {
    setEditor(prev => {
      const rangos = prev[dia].rangos.filter((_, i) => i !== idx)
      return { ...prev, [dia]: { ...prev[dia], rangos: rangos.length ? rangos : [{ hora_apertura: '09:00', hora_cierre: '19:00' }] } }
    })
  }

  const abrirEditar = (b: Barbero) => {
    setEditBarbero(b)
    setFormEditar({ nombre_completo: b.persona.nombre_completo, telefono: b.persona.telefono, correo_electronico: b.persona.correo_electronico, comision_porcentaje: String(b.comision_porcentaje), puede_cobrar: !!b.puede_cobrar, puede_vender: !!b.puede_vender, especialidades: b.especialidades ?? '' })
    setErrorEditar('')
    setModalEditar(true)
  }

  const handleGuardarEditar = async () => {
    if (!editBarbero) return
    setLoadingEditar(true); setErrorEditar('')
    try {
      await api.put(`/barberos/${editBarbero.idusuario}`, { ...formEditar, comision_porcentaje: Number(formEditar.comision_porcentaje) })
      setModalEditar(false)
      cargar()
    } catch (err: unknown) {
      setErrorEditar(err instanceof Error ? err.message : 'Error al guardar.')
    } finally { setLoadingEditar(false) }
  }

  const iniciales = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  const filtrados = barberos.filter(b => b.persona.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <>
      <AdminHeader
        title="Barberos"
        description="Gestioná el equipo de tu barbería"
        actions={
          <Button className="gap-2" onClick={abrirCrear}>
            <Plus className="size-4" /><span className="hidden sm:inline">Nuevo Barbero</span>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Barberos Activos</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barberos.length}</div>
              <p className="text-xs text-muted-foreground">en tu equipo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating Promedio</CardTitle>
              <Star className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {barberos.length ? (barberos.reduce((a, b) => a + Number(b.rating_promedio), 0) / barberos.length).toFixed(1) : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar barbero..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay barberos registrados todavía</p>
            <Button variant="outline" size="sm" onClick={abrirCrear}><Plus className="mr-2 size-4" /> Agregar barbero</Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbero</TableHead>
                    <TableHead className="hidden md:table-cell">Contacto</TableHead>
                    <TableHead className="hidden sm:table-cell">Comisión</TableHead>
                    <TableHead className="hidden sm:table-cell">Rating</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map(b => (
                    <TableRow key={b.idusuario}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
                            {b.persona.foto_url
                              ? <Image src={b.persona.foto_url} alt={b.persona.nombre_completo} fill className="object-cover" />
                              : <span className="flex h-full items-center justify-center text-xs font-medium text-primary">{iniciales(b.persona.nombre_completo)}</span>
                            }
                          </div>
                          <p className="font-medium">{b.persona.nombre_completo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <p>{b.persona.correo_electronico}</p>
                          <p className="text-muted-foreground">{b.persona.telefono}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{b.comision_porcentaje}%</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="size-3.5 fill-primary text-primary" />
                          {Number(b.rating_promedio).toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.rol === 'admin' ? 'default' : 'secondary'}>{b.rol}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirEditar(b)}>
                              <Pencil className="mr-2 size-4" />Editar datos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setFotoBarbero(b); setErrorFoto(''); setModalFoto(true) }}>
                              <Users className="mr-2 size-4" />Cambiar foto de perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => abrirHorarios(b)}>
                              <Clock className="mr-2 size-4" />Configurar horarios
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPassBarb(b); setNuevaPass(''); setErrorPass(''); setModalPass(true) }}>
                              <KeyRound className="mr-2 size-4" />Cambiar contraseña
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleEstado(b)}>
                              <Power className="mr-2 size-4" />
                              {(b.estado ?? 'activo') === 'activo' ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setEliminarBarbero(b); setModalEliminar(true) }}>
                              <Trash2 className="mr-2 size-4" />Eliminar barbero
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal nuevo barbero */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar barbero</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo *</Label>
              <Input placeholder="Ej: Alejandro Romero" value={form.nombre_completo}
                onChange={e => setForm(p => ({ ...p, nombre_completo: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico *</Label>
              <Input type="email" placeholder="alex@barberstudio.com" value={form.correo_electronico}
                onChange={e => setForm(p => ({ ...p, correo_electronico: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono *</Label>
              <Input placeholder="+54 11 1234-5678" value={form.telefono}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contraseña *</Label>
                <Input type="password" placeholder="Mín. 6 caracteres" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Comisión (%)</Label>
                <Input type="number" min="0" max="100" placeholder="35" value={form.comision_porcentaje}
                  onChange={e => setForm(p => ({ ...p, comision_porcentaje: e.target.value }))} />
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Registrar barbero'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal horarios */}
      <Dialog open={modalHorarios} onOpenChange={setModalHorarios}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Horarios de {horariosBarbero?.persona.nombre_completo}</DialogTitle>
            <DialogDescription>
              Activá los días que trabaja. Podés agregar rangos para definir pausas (ej: 09:00–13:00 y 14:00–19:00).
            </DialogDescription>
          </DialogHeader>

          {loadingHorarios ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <div className="space-y-3 py-2">
              {DIAS.map(d => {
                const dia = editor[d.num] ?? { activo: false, rangos: [{ hora_apertura: '09:00', hora_cierre: '19:00' }] }
                return (
                  <div key={d.num} className={`rounded-lg border p-3 transition-colors ${dia.activo ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                    {/* Cabecera del día */}
                    <div className="flex items-center gap-3">
                      <Switch checked={dia.activo} onCheckedChange={v => toggleDia(d.num, v)} />
                      <span className={`w-24 text-sm font-medium ${!dia.activo ? 'text-muted-foreground' : ''}`}>{d.label}</span>
                      {!dia.activo && <span className="text-xs text-muted-foreground">No trabaja</span>}
                    </div>

                    {/* Rangos horarios */}
                    {dia.activo && (
                      <div className="mt-2 space-y-2 pl-10">
                        {dia.rangos.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={r.hora_apertura}
                              onChange={e => setRango(d.num, idx, 'hora_apertura', e.target.value)}
                              className="h-8 w-28 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">hasta</span>
                            <Input
                              type="time"
                              value={r.hora_cierre}
                              onChange={e => setRango(d.num, idx, 'hora_cierre', e.target.value)}
                              className="h-8 w-28 text-sm"
                            />
                            {dia.rangos.length > 1 && (
                              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => quitarRango(d.num, idx)}>
                                <X className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => agregarRango(d.num)}>
                          <Plus className="mr-1 size-3" />Agregar pausa / turno extra
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {errorHorarios && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorHorarios}</p>}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalHorarios(false)}>Cancelar</Button>
            <Button onClick={handleGuardarHorarios} disabled={loadingHorarios}>
              {loadingHorarios ? 'Guardando...' : 'Guardar horarios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal editar barbero */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar barbero</DialogTitle>
            <DialogDescription>Modificá los datos de {editBarbero?.persona.nombre_completo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input value={formEditar.nombre_completo} onChange={e => setFormEditar(p => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono (WhatsApp)</Label>
              <Input value={formEditar.telefono} onChange={e => setFormEditar(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 9 11 1234-5678" />
              <p className="text-xs text-muted-foreground">Este número recibe los avisos de turnos nuevos</p>
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input type="email" value={formEditar.correo_electronico} onChange={e => setFormEditar(p => ({ ...p, correo_electronico: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Comisión (%)</Label>
              <Input type="number" min="0" max="100" value={formEditar.comision_porcentaje} onChange={e => setFormEditar(p => ({ ...p, comision_porcentaje: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidades</Label>
              <Input value={formEditar.especialidades} onChange={e => setFormEditar(p => ({ ...p, especialidades: e.target.value }))} placeholder="Corte clásico, Barba, Fade" />
              <p className="text-xs text-muted-foreground">Separadas por coma. Se muestran como tags en la página de reservas.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Puede registrar cobros</p>
                <p className="text-xs text-muted-foreground">Verá la pestaña Caja en su panel</p>
              </div>
              <Switch checked={formEditar.puede_cobrar} onCheckedChange={v => setFormEditar(p => ({ ...p, puede_cobrar: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Puede vender productos</p>
                <p className="text-xs text-muted-foreground">Verá la pestaña Productos en su panel</p>
              </div>
              <Switch checked={formEditar.puede_vender} onCheckedChange={v => setFormEditar(p => ({ ...p, puede_vender: v }))} />
            </div>
            {errorEditar && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorEditar}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalEditar(false)}>Cancelar</Button>
            <Button onClick={handleGuardarEditar} disabled={loadingEditar}>{loadingEditar ? 'Guardando...' : 'Guardar cambios'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cambiar foto */}
      <Dialog open={modalFoto} onOpenChange={setModalFoto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>Cambiá la foto de {fotoBarbero?.persona.nombre_completo}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative size-24 overflow-hidden rounded-full bg-primary/10">
              {fotoBarbero?.persona.foto_url
                ? <Image src={fotoBarbero.persona.foto_url} alt="" fill className="object-cover" />
                : <span className="flex h-full items-center justify-center text-2xl font-bold text-primary">{fotoBarbero ? iniciales(fotoBarbero.persona.nombre_completo) : ''}</span>
              }
            </div>
            {errorFoto && <p className="text-sm text-destructive">{errorFoto}</p>}
            <label className="cursor-pointer">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm transition-colors hover:bg-muted/60">
                {subiendoFoto ? 'Subiendo...' : 'Seleccionar imagen'}
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={subiendoFoto}
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file || !fotoBarbero) return
                  setSubiendoFoto(true); setErrorFoto('')
                  try {
                    const fd = new FormData(); fd.append('imagen', file)
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/barberos/${fotoBarbero.idusuario}/foto`, {
                      method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)
                    setFotoBarbero(p => p ? { ...p, persona: { ...p.persona, foto_url: data.foto_url } } : p)
                    cargar()
                  } catch (err: unknown) {
                    setErrorFoto(err instanceof Error ? err.message : 'Error al subir.')
                  } finally { setSubiendoFoto(false) }
                }} />
            </label>
            <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · Máximo 5MB</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFoto(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cambiar contraseña */}
      <Dialog open={modalPass} onOpenChange={setModalPass}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>{passBarb?.persona.nombre_completo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nueva contraseña</Label>
              <Input type="password" placeholder="Mín. 6 caracteres" value={nuevaPass}
                onChange={e => setNuevaPass(e.target.value)} />
            </div>
            {errorPass && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorPass}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalPass(false)}>Cancelar</Button>
            <Button onClick={cambiarPassword} disabled={loadingPass || nuevaPass.length < 6}>
              {loadingPass ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar eliminación */}
      <Dialog open={modalEliminar} onOpenChange={setModalEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar barbero</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés eliminar a <strong>{eliminarBarbero?.persona.nombre_completo}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalEliminar(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar} disabled={loadingEliminar}>
              {loadingEliminar ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
