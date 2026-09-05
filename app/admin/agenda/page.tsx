'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserCheck, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Turno = {
  idagenda: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: 'pendiente' | 'confirmado' | 'atendido' | 'cobrado' | 'ausente' | 'cancelado' | 'archivado'
  servicio: { nombre_servicio: string; precio: number; duracion_minutos: number }
  cliente?: { persona: { nombre_completo: string } }
  barbero: { idusuario: number; persona: { nombre_completo: string } }
}

type Servicio = { idservicio: number; nombre_servicio: string; duracion_minutos: number; precio: number; estado: string }
type Barbero = { idusuario: number; estado?: string; persona: { nombre_completo: string } }

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'text-yellow-500',        bgColor: 'bg-yellow-400/10 border-yellow-400/20' },
  confirmado: { label: 'Confirmado', color: 'text-primary',           bgColor: 'bg-primary/10 border-primary/20' },
  atendido:   { label: 'Atendido · Falta cobrar', color: 'text-yellow-500',  bgColor: 'bg-yellow-400/10 border-yellow-400/20' },
  cobrado:    { label: 'Atendido · Cobrado',      color: 'text-green-500',   bgColor: 'bg-green-500/10 border-green-500/20' },
  ausente:    { label: 'Ausente',                 color: 'text-orange-500',  bgColor: 'bg-orange-500/10 border-orange-500/20' },
  cancelado:  { label: 'Cancelado',  color: 'text-destructive',       bgColor: 'bg-destructive/10 border-destructive/20' },
  archivado:  { label: 'Archivado',  color: 'text-muted-foreground',  bgColor: 'bg-muted border-muted' },
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const fullDaysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const horariosDisponibles = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

const formatDateString = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

// ── Página ────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [turnoCancelar, setTurnoCancelar] = useState<Turno | null>(null)
  const [motivoCancelar, setMotivoCancelar] = useState('')
  const [guardandoCancelar, setGuardandoCancelar] = useState(false)

  // Datos de la API
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])

  // Formulario nuevo turno
  const [nuevoTurno, setNuevoTurno] = useState({
    nombre_cliente: '', telefono_cliente: '', correo_electronico: '', idservicio: '', idusuario_barbero: '', hora_inicio: '', fecha: '',
  })

  const cargarTurnos = useCallback(async () => {
    try {
      // En vista día pedimos solo ese día; en semana/mes cargamos todo y filtramos en cliente
      const fecha = viewMode === 'day' ? `?fecha=${formatDateString(selectedDate)}` : ''
      const data = await api.get<Turno[]>(`/turnos${fecha}`)
      setTurnos(data)
    } catch { setTurnos([]) }
  }, [selectedDate, viewMode])

  useEffect(() => { cargarTurnos() }, [cargarTurnos])

  useEffect(() => {
    Promise.allSettled([api.get<Servicio[]>('/servicios'), api.get<Barbero[]>('/barberos')]).then(([svcs, barbs]) => {
      if (svcs.status === 'fulfilled') setServicios(svcs.value)
      if (barbs.status === 'fulfilled') setBarberos(barbs.value)
    })
  }, [])

  // Calendario mes
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    return days
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [selectedDate])

  const filteredTurnos = turnos.filter(t => selectedBarberId === 'all' || String(t.barbero?.idusuario) === selectedBarberId)

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateString(date)
    return filteredTurnos.filter(t => t.fecha === dateStr)
  }

  const calcularHoraFin = (horaInicio: string, duracion: number) => {
    const [h, m] = horaInicio.split(':').map(Number)
    const total = h * 60 + m + duracion
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
  }

  const handleCrearTurno = async () => {
    const servicio = servicios.find(s => s.idservicio === Number(nuevoTurno.idservicio))
    if (!servicio || !nuevoTurno.idusuario_barbero || !nuevoTurno.hora_inicio || !nuevoTurno.fecha) return
    try {
      await api.post('/turnos', {
        nombre_cliente: nuevoTurno.nombre_cliente || undefined,
        telefono_cliente: nuevoTurno.telefono_cliente || undefined,
        correo_electronico: nuevoTurno.correo_electronico || undefined,
        idusuario_barbero: Number(nuevoTurno.idusuario_barbero),
        idservicio: Number(nuevoTurno.idservicio),
        fecha: nuevoTurno.fecha,
        hora_inicio: `${nuevoTurno.hora_inicio}:00`,
        hora_fin: calcularHoraFin(nuevoTurno.hora_inicio, servicio.duracion_minutos),
      })
      setIsCreateDialogOpen(false)
      setNuevoTurno({ nombre_cliente: '', telefono_cliente: '', correo_electronico: '', idservicio: '', idusuario_barbero: '', hora_inicio: '', fecha: '' })
      cargarTurnos()
    } catch (err) { console.error(err) }
  }

  const cambiarEstado = async (idagenda: number, estado: string) => {
    try {
      await api.patch(`/turnos/${idagenda}/estado`, { estado })
      cargarTurnos()
    } catch (err) { console.error(err) }
  }

  const abrirCancelacion = (turno: Turno) => {
    setTurnoCancelar(turno)
    setMotivoCancelar('')
    setModalCancelar(true)
  }

  const confirmarCancelacion = async () => {
    if (!turnoCancelar) return
    setGuardandoCancelar(true)
    try {
      await api.patch(`/turnos/${turnoCancelar.idagenda}/cancelar`, { motivo: motivoCancelar || undefined })
      setModalCancelar(false)
      setTurnoCancelar(null)
      cargarTurnos()
    } catch (err) { console.error(err) }
    finally { setGuardandoCancelar(false) }
  }

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString()

  return (
    <>
      <AdminHeader
        title="Agenda"
        description="Gestiona los turnos y reservas"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nuevo Turno</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Turno</DialogTitle>
                <DialogDescription>Agenda un nuevo turno para un cliente</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre del cliente (opcional)</Label>
                  <Input placeholder="Ej: Juan Pérez"
                    value={nuevoTurno.nombre_cliente}
                    onChange={e => setNuevoTurno(p => ({ ...p, nombre_cliente: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono del cliente (opcional)</Label>
                  <Input placeholder="+54 11 1234-5678"
                    value={nuevoTurno.telefono_cliente}
                    onChange={e => setNuevoTurno(p => ({ ...p, telefono_cliente: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Email del cliente (opcional — para enviar confirmación)</Label>
                  <Input type="email" placeholder="cliente@email.com"
                    value={nuevoTurno.correo_electronico}
                    onChange={e => setNuevoTurno(p => ({ ...p, correo_electronico: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Servicio</Label>
                  <Select value={nuevoTurno.idservicio} onValueChange={v => setNuevoTurno(p => ({ ...p, idservicio: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                    <SelectContent>
                      {servicios.filter(s => s.estado === 'activo').map(s => (
                        <SelectItem key={s.idservicio} value={String(s.idservicio)}>
                          {s.nombre_servicio} — {s.duracion_minutos}min — ${Number(s.precio).toLocaleString('es-AR')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Barbero</Label>
                  <Select value={nuevoTurno.idusuario_barbero} onValueChange={v => setNuevoTurno(p => ({ ...p, idusuario_barbero: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                    <SelectContent>
                      {barberos.filter(b => (b.estado ?? 'activo') === 'activo').map(b => (
                        <SelectItem key={b.idusuario} value={String(b.idusuario)}>
                          {b.persona.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={nuevoTurno.fecha}
                      onChange={e => setNuevoTurno(p => ({ ...p, fecha: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hora</Label>
                    <Select value={nuevoTurno.hora_inicio} onValueChange={v => setNuevoTurno(p => ({ ...p, hora_inicio: v }))}>
                      <SelectTrigger><SelectValue placeholder="Horario" /></SelectTrigger>
                      <SelectContent>
                        {horariosDisponibles.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button
                  onClick={handleCrearTurno}
                  disabled={!nuevoTurno.idservicio || !nuevoTurno.idusuario_barbero || !nuevoTurno.hora_inicio || !nuevoTurno.fecha}
                >
                  Crear Turno
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as typeof viewMode)}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los barberos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los barberos</SelectItem>
                {barberos.filter(b => (b.estado ?? 'activo') === 'activo').map(b => (
                  <SelectItem key={b.idusuario} value={String(b.idusuario)}>{b.persona.nombre_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}>
              Hoy
            </Button>
          </div>
        </div>

        {/* Vista Día */}
        {viewMode === 'day' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d) }}>
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="text-center">
                  <CardTitle className="text-lg">
                    {fullDaysOfWeek[selectedDate.getDay()]} {selectedDate.getDate()}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d) }}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Badge variant="outline">{getAppointmentsForDate(selectedDate).length} turnos</Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {horariosDisponibles.map((hora, horaIdx) => {
                    const nextHora = horariosDisponibles[horaIdx + 1] ?? '23:59'
                    const aptsHora = getAppointmentsForDate(selectedDate).filter(t => {
                      const h = t.hora_inicio.slice(0, 5)
                      return h >= hora && h < nextHora
                    })
                    return (
                      <div key={hora} className="flex gap-4 border-b border-border/50 pb-2">
                        <div className="w-16 shrink-0 pt-2 text-sm text-muted-foreground">{hora}</div>
                        <div className="flex-1 min-h-[60px]">
                          {aptsHora.length > 0 ? (
                            <div className="space-y-2">
                              {aptsHora.map(t => {
                                const status = statusConfig[t.estado] ?? statusConfig.pendiente
                                return (
                                  <div key={t.idagenda} className={cn('rounded-lg border p-3', status.bgColor)}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="size-8">
                                          <AvatarFallback className="text-xs">
                                            {getInitials(t.cliente?.persona.nombre_completo ?? 'SC')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">{t.cliente?.persona.nombre_completo ?? 'Sin cliente'}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {t.servicio.nombre_servicio} · {t.hora_inicio.slice(0,5)}–{t.hora_fin.slice(0,5)} · {t.barbero?.persona?.nombre_completo ?? '—'}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={status.color}>{status.label}</Badge>
                                        {!['archivado', 'cancelado', 'cobrado'].includes(t.estado) && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="size-7">
                                                <MoreHorizontal className="size-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              {t.estado !== 'confirmado' && t.estado !== 'atendido' && (
                                                <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'confirmado')}>
                                                  <CheckCircle className="mr-2 size-4 text-primary" />Confirmar
                                                </DropdownMenuItem>
                                              )}
                                              {t.estado !== 'atendido' && (
                                                <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'atendido')}>
                                                  <UserCheck className="mr-2 size-4 text-green-500" />Marcar atendido
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem onClick={() => abrirCancelacion(t)} className="text-destructive">
                                                <XCircle className="mr-2 size-4" />Cancelar turno
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex h-full items-center">
                              <span className="text-sm text-muted-foreground/50">Disponible</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Vista Semana */}
        {viewMode === 'week' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d) }}>
                  <ChevronLeft className="size-4" />
                </Button>
                <CardTitle className="text-lg">
                  {weekDays[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d) }}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, i) => (
                  <div key={i} className={cn('min-h-[200px] rounded-lg border p-2', isToday(day) && 'border-primary', isSelected(day) && 'bg-muted/50')}>
                    <div className="mb-2 text-center">
                      <p className="text-xs text-muted-foreground">{daysOfWeek[day.getDay()]}</p>
                      <p className={cn('text-sm font-medium', isToday(day) && 'text-primary')}>{day.getDate()}</p>
                    </div>
                    <div className="space-y-1">
                      {getAppointmentsForDate(day).slice(0, 3).map(t => {
                        const status = statusConfig[t.estado] ?? statusConfig.pendiente
                        return (
                          <div key={t.idagenda} className={cn('rounded p-1 text-xs', status.bgColor)}>
                            <p className="truncate font-medium">{t.hora_inicio.slice(0, 5)}</p>
                            <p className="truncate text-muted-foreground">{t.cliente?.persona.nombre_completo ?? 'Sin cliente'}</p>
                          </div>
                        )
                      })}
                      {getAppointmentsForDate(day).length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">+{getAppointmentsForDate(day).length - 3} mas</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista Mes */}
        {viewMode === 'month' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d) }}>
                  <ChevronLeft className="size-4" />
                </Button>
                <CardTitle className="text-lg capitalize">
                  {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d) }}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">{day}</div>
                ))}
                {calendarDays.map(({ date, isCurrentMonth }, i) => {
                  const dayApts = getAppointmentsForDate(date)
                  return (
                    <button key={i} onClick={() => { setSelectedDate(date); setViewMode('day') }}
                      className={cn('min-h-[80px] rounded-lg border p-2 text-left transition-colors hover:bg-muted/50',
                        !isCurrentMonth && 'opacity-40', isToday(date) && 'border-primary', isSelected(date) && 'bg-primary/10')}
                    >
                      <p className={cn('text-sm', isToday(date) && 'font-bold text-primary')}>{date.getDate()}</p>
                      {dayApts.length > 0 && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {dayApts.length} turno{dayApts.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Modal cancelar turno */}
      <Dialog open={modalCancelar} onOpenChange={v => { if (!guardandoCancelar) setModalCancelar(v) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              {turnoCancelar && (
                <>
                  {turnoCancelar.cliente?.persona.nombre_completo ?? 'Sin cliente'} — {turnoCancelar.servicio.nombre_servicio} el {new Date(turnoCancelar.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {turnoCancelar.hora_inicio.slice(0, 5)} hs
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo (opcional — se incluye en el email al cliente)</Label>
            <Textarea
              placeholder="Ej: El barbero no estará disponible ese día."
              value={motivoCancelar}
              onChange={e => setMotivoCancelar(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelar(false)} disabled={guardandoCancelar}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmarCancelacion} disabled={guardandoCancelar}>
              {guardandoCancelar ? 'Cancelando...' : 'Confirmar cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
