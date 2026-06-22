'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

type Turno = {
  idagenda: number; fecha: string; hora_inicio: string; hora_fin: string; estado: string
  servicio: { nombre_servicio: string; precio: number; duracion_minutos: number }
  cliente?: { persona: { nombre_completo: string; telefono: string } }
}
type Perfil = { nombre_completo: string; rating_promedio: number; comision_porcentaje: number; foto_url?: string | null }
type Servicio = { idservicio: number; nombre_servicio: string; duracion_minutos: number; precio: number }

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  pendiente:  { label: 'Reservado',  className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmado: { label: 'Confirmado', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  atendido:   { label: 'Atendido',   className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  ausente:    { label: 'Ausente',    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  cancelado:  { label: 'Cancelado',  className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const HORAS = Array.from({ length: 24 }, (_, h) =>
  ['00','15','30','45'].map(m => `${String(h).padStart(2,'0')}:${m}`)
).flat()

const DIAS_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FORM_VACIO = { nombre_cliente: '', telefono_cliente: '', idservicio: '', hora_inicio: '', fecha: '' }

export default function BarberoPage() {
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tab, setTab] = useState<'hoy' | 'agenda' | 'stats'>('hoy')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...FORM_VACIO, fecha: hoyStr })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Turno[]>(`/turnos?fecha=${hoyStr}`).then(setTurnos).catch(() => {})
    api.get<Perfil>('/mi-perfil').then(setPerfil).catch(() => {})
    api.get<Servicio[]>('/servicios').then(setServicios).catch(() => {})
  }, [])

  const recargar = () => api.get<Turno[]>(`/turnos?fecha=${hoyStr}`).then(setTurnos).catch(() => {})

  const cambiarEstado = async (id: number, estado: string) => {
    await api.patch(`/turnos/${id}/estado`, { estado })
    recargar()
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const servicio = servicios.find(s => s.idservicio === Number(form.idservicio))
    if (!servicio) return setError('Seleccioná un servicio.')
    if (!form.nombre_cliente || !form.hora_inicio || !form.fecha) return setError('Completá los campos obligatorios.')
    const [h, m] = form.hora_inicio.split(':').map(Number)
    const finMin = h * 60 + m + servicio.duracion_minutos
    const hora_fin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
    setGuardando(true)
    try {
      await api.post('/turnos', { ...form, idservicio: Number(form.idservicio), hora_fin, tipo_alta: 'orden_de_llegada' })
      setModal(false); setForm({ ...FORM_VACIO, fecha: hoyStr }); recargar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally { setGuardando(false) }
  }

  const turnosOrdenados = [...turnos].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const activos = turnosOrdenados.filter(t => t.estado !== 'atendido' && t.estado !== 'cancelado' && t.estado !== 'ausente')
  const proximo = activos[0]

  const hechos = turnos.filter(t => t.estado === 'atendido').length
  const pendientes = turnos.filter(t => t.estado === 'pendiente' || t.estado === 'confirmado').length
  const ingresos = turnos.filter(t => t.estado === 'atendido').reduce((a, t) => a + Number(t.servicio.precio), 0)
  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

  // Próximos 5 días para la pestaña Agenda
  const proximosDias = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return { fecha: d.toISOString().split('T')[0], label: `${DIAS_FULL[d.getDay()]} ${d.getDate()}` }
  })

  const tiempoHastaProximo = proximo ? (() => {
    const [ph, pm] = proximo.hora_inicio.split(':').map(Number)
    const ahora = new Date()
    const diff = (ph * 60 + pm) - (ahora.getHours() * 60 + ahora.getMinutes())
    if (diff <= 0) return 'Ahora'
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff/60)}h ${diff%60}min`
  })() : null

  const fechaLabel = `${DIAS_FULL[hoy.getDay()]}, ${hoy.getDate()} De ${MESES[hoy.getMonth()]}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-5">
        {/* Saludo */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {perfil?.foto_url
              ? <img src={perfil.foto_url} alt={perfil.nombre_completo} className="size-12 object-cover" />
              : <span className="flex h-full items-center justify-center text-sm font-bold text-primary">
                  {perfil?.nombre_completo.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() ?? '..'}
                </span>
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hola, {perfil?.nombre_completo.split(' ')[0] ?? '...'}</h1>
            <p className="text-sm text-muted-foreground">{fechaLabel}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { val: turnos.length, label: 'TURNOS', color: 'text-foreground' },
            { val: hechos, label: 'HECHOS', color: 'text-green-400' },
            { val: pendientes, label: 'PENDIENTES', color: 'text-blue-400' },
            { val: fmt(ingresos), label: 'HOY', color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-card/30 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Próximo turno */}
        {proximo && (
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">Próximo turno</p>
              <p className="truncate font-semibold">{proximo.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
              <p className="truncate text-sm text-muted-foreground">{proximo.servicio.nombre_servicio}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold">{proximo.hora_inicio.slice(0,5)}</p>
              <p className="text-xs text-primary/70">{tiempoHastaProximo}</p>
            </div>
          </div>
        )}

        {/* Botón registrar orden de llegada */}
        <button
          onClick={() => { setForm({ ...FORM_VACIO, fecha: hoyStr }); setError(''); setModal(true) }}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/20 py-3 text-sm text-muted-foreground transition-colors hover:bg-card/40"
        >
          <Plus className="size-4" />
          Registrar turno por orden de llegada
        </button>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-3 rounded-xl border border-border/50 bg-card/20 p-1">
          {(['hoy', 'agenda', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg py-2 text-sm capitalize transition-colors ${tab === t ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'hoy' ? 'Hoy' : t === 'agenda' ? 'Agenda' : 'Stats'}
            </button>
          ))}
        </div>

        {/* Tab: Hoy */}
        {tab === 'hoy' && (
          <div className="space-y-2">
            {turnosOrdenados.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay turnos para hoy</p>
            ) : turnosOrdenados.map(t => {
              const est = ESTADO_BADGE[t.estado] ?? ESTADO_BADGE.pendiente
              const finalizado = t.estado === 'atendido' || t.estado === 'ausente' || t.estado === 'cancelado'
              return (
                <div key={t.idagenda} className={`flex items-center gap-3 rounded-xl border border-border/30 bg-card/20 px-4 py-3 ${finalizado ? 'opacity-50' : ''}`}>
                  <div className="w-12 shrink-0">
                    <span className="text-sm font-bold">{t.hora_inicio.slice(0,5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${est.className}`}>{est.label}</span>
                  {!finalizado && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground">
                          <ChevronRight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {t.estado === 'pendiente' && (
                          <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'confirmado')}>
                            <CheckCircle className="mr-2 size-4 text-green-500" />Confirmar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'atendido')}>
                          <CheckCircle className="mr-2 size-4 text-primary" />Marcar atendido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'ausente')}>
                          <AlertCircle className="mr-2 size-4 text-orange-400" />Ausente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'cancelado')} className="text-destructive">
                          <XCircle className="mr-2 size-4" />Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tab: Agenda */}
        {tab === 'agenda' && (
          <div className="space-y-3">
            {proximosDias.map(d => (
              <AgendaDia key={d.fecha} fecha={d.fecha} label={d.label} />
            ))}
          </div>
        )}

        {/* Tab: Stats */}
        {tab === 'stats' && (
          <StatsTab turnos={turnos} perfil={perfil} />
        )}
      </div>

      {/* Modal nuevo turno */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Turno</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Nombre del cliente *</Label>
              <Input placeholder="Ej: Juan Perez" value={form.nombre_cliente}
                onChange={e => setForm(p => ({...p, nombre_cliente: e.target.value}))} required />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input placeholder="+54 11 1234-5678" value={form.telefono_cliente}
                onChange={e => setForm(p => ({...p, telefono_cliente: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <Label>Servicio *</Label>
              <Select value={form.idservicio} onValueChange={v => setForm(p => ({...p, idservicio: v}))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                <SelectContent>
                  {servicios.map(s => (
                    <SelectItem key={s.idservicio} value={String(s.idservicio)}>
                      {s.nombre_servicio} ({s.duracion_minutos} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fecha *</Label>
                <Input type="date" value={form.fecha} min={hoyStr}
                  onChange={e => setForm(p => ({...p, fecha: e.target.value}))} required />
              </div>
              <div className="grid gap-2">
                <Label>Hora *</Label>
                <Select value={form.hora_inicio} onValueChange={v => setForm(p => ({...p, hora_inicio: v}))}>
                  <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {HORAS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Crear turno'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Subcomponente: un día en la pestaña Agenda ────────────────────────────────
function AgendaDia({ fecha, label }: { fecha: string; label: string }) {
  const [turnos, setTurnos] = useState<Turno[] | null>(null)

  useEffect(() => {
    api.get<Turno[]>(`/turnos?fecha=${fecha}`).then(setTurnos).catch(() => setTurnos([]))
  }, [fecha])

  return (
    <div>
      <p className="mb-1 font-semibold">{label}</p>
      {turnos === null ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : turnos.length === 0 ? (
        <p className="text-xs text-muted-foreground">0 turnos programados</p>
      ) : (
        <div className="space-y-1">
          {[...turnos].sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(t => (
            <div key={t.idagenda} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/20 px-3 py-2 text-sm">
              <span className="w-11 text-xs font-medium">{t.hora_inicio.slice(0,5)}</span>
              <span className="flex-1 truncate">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</span>
              <span className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Subcomponente: Stats ──────────────────────────────────────────────────────
function StatsTab({ turnos, perfil }: { turnos: Turno[]; perfil: Perfil | null }) {
  const atendidos = turnos.filter(t => t.estado === 'atendido').length
  const ingresos = turnos.filter(t => t.estado === 'atendido').reduce((a, t) => a + Number(t.servicio.precio), 0)
  const ausentes = turnos.filter(t => t.estado === 'ausente').length
  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

  const cuentaServ: Record<string, number> = {}
  turnos.filter(t => t.estado === 'atendido').forEach(t => {
    cuentaServ[t.servicio.nombre_servicio] = (cuentaServ[t.servicio.nombre_servicio] ?? 0) + 1
  })
  const maxServ = Math.max(...Object.values(cuentaServ), 1)
  const serviciosOrden = Object.entries(cuentaServ).sort((a, b) => b[1] - a[1])

  return (
    <div className="rounded-xl border border-border/30 bg-card/10">
      {/* Métricas */}
      <div className="p-5">
        <p className="mb-4 text-sm font-semibold">Este mes</p>
        <div className="grid grid-cols-2 gap-y-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>👤</span> Turnos atendidos
            </p>
            <p className="mt-1 text-3xl font-bold">{atendidos}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>$</span> Ingresos
            </p>
            <p className="mt-1 text-3xl font-bold">{fmt(ingresos)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>⭐</span> Calificación
            </p>
            <p className="mt-1 text-3xl font-bold">{Number(perfil?.rating_promedio ?? 0).toFixed(1)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>⚠️</span> Ausencias
            </p>
            <p className="mt-1 text-3xl font-bold">{ausentes}</p>
          </div>
        </div>
      </div>

      {/* Servicios */}
      {serviciosOrden.length > 0 && (
        <>
          <div className="border-t border-border/30" />
          <div className="p-5">
            <p className="mb-4 text-sm font-semibold">Servicios realizados</p>
            <div className="space-y-4">
              {serviciosOrden.map(([nombre, count]) => (
                <div key={nombre}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{nombre}</span>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-1.5 h-px w-full bg-border/30">
                    <div className="h-px bg-yellow-500" style={{ width: `${(count / maxServ) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
