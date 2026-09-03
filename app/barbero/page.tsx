'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, Plus, CheckCircle, XCircle, AlertCircle, DollarSign, Banknote, Smartphone, CreditCard, LayoutDashboard } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

type Turno = {
  idagenda: number; fecha: string; hora_inicio: string; hora_fin: string; estado: string
  servicio: { nombre_servicio: string; precio: number; duracion_minutos: number }
  cliente?: { persona: { nombre_completo: string; telefono: string } }
}
type Perfil = { nombre_completo: string; rating_promedio: number; comision_porcentaje: number; puede_cobrar?: boolean; puede_vender?: boolean; foto_url?: string | null }
type ConfigBarberia = { orden_llegada: boolean }
type ProductoVenta = { idproducto: number; nombre_producto: string; precio_venta: number; stock_actual: number }
type TurnoPendienteCobro = {
  idagenda: number; fecha: string; hora_inicio: string
  servicio: { nombre_servicio: string; precio: number }
  cliente?: { persona: { nombre_completo: string } }
}
type Servicio = { idservicio: number; nombre_servicio: string; duracion_minutos: number; precio: number }

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  pendiente:  { label: 'Reservado',  className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmado: { label: 'Confirmado', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  atendido:   { label: 'Atendido · Falta cobrar', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  cobrado:    { label: 'Atendido · Cobrado',      className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ausente:    { label: 'Ausente',                 className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
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
  const [tab, setTab] = useState<'hoy' | 'agenda' | 'stats' | 'caja' | 'productos'>('hoy')
  const [turnosPendientesCobro, setTurnosPendientesCobro] = useState<TurnoPendienteCobro[]>([])
  const [modalCobro, setModalCobro] = useState(false)
  const [turnoACobrar, setTurnoACobrar] = useState<TurnoPendienteCobro | null>(null)
  const [montoCobro, setMontoCobro] = useState('')
  const [metodoCobro, setMetodoCobro] = useState('efectivo')
  const [guardandoCobro, setGuardandoCobro] = useState(false)
  const [errorCobro, setErrorCobro] = useState('')

  // Venta productos
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([])
  const [modalVenta, setModalVenta] = useState(false)
  const [formVenta, setFormVenta] = useState({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' })
  const [guardandoVenta, setGuardandoVenta] = useState(false)
  const [errorVenta, setErrorVenta] = useState('')
  const [ordenLlegada, setOrdenLlegada] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...FORM_VACIO, fecha: hoyStr })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [turnosDia, setTurnosDia] = useState<Turno[]>([])

  // Cancelación con motivo
  const [modalCancelar, setModalCancelar] = useState(false)
  const [turnoCancelar, setTurnoCancelar] = useState<Turno | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [guardandoCancelacion, setGuardandoCancelacion] = useState(false)

  useEffect(() => {
    api.get<Turno[]>(`/turnos?fecha=${hoyStr}`).then(setTurnos).catch(() => {})
    api.get<Perfil>('/mi-perfil').then(p => {
      setPerfil(p)
      if (p.puede_cobrar) cargarPendientesCobro()
      if (p.puede_vender) api.get<ProductoVenta[]>('/productos').then(setProductosVenta).catch(() => {})
    }).catch(() => {})
    api.get<Servicio[]>('/servicios').then(setServicios).catch(() => {})
    api.get<ConfigBarberia>('/mi-barberia').then(d => setOrdenLlegada(d.orden_llegada ?? true)).catch(() => {})
  }, [])

  const recargar = () => api.get<Turno[]>(`/turnos?fecha=${hoyStr}`).then(setTurnos).catch(() => {})

  const abrirCancelacion = (t: Turno) => { setTurnoCancelar(t); setMotivoCancelacion(''); setModalCancelar(true) }
  const confirmarCancelacion = async () => {
    if (!turnoCancelar) return
    setGuardandoCancelacion(true)
    try {
      await api.patch(`/turnos/${turnoCancelar.idagenda}/cancelar`, { motivo: motivoCancelacion })
      setModalCancelar(false); recargar()
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error al cancelar') }
    finally { setGuardandoCancelacion(false) }
  }
  const cargarPendientesCobro = () => api.get<TurnoPendienteCobro[]>('/pagos/turnos-pendientes').then(setTurnosPendientesCobro).catch(() => {})

  const cambiarEstado = async (id: number, estado: string) => {
    await api.patch(`/turnos/${id}/estado`, { estado })
    recargar()
  }

  const cargarTurnosDia = (fecha: string) =>
    api.get<Turno[]>(`/turnos?fecha=${fecha}`)
      .then(t => setTurnosDia(t.filter(x => x.estado !== 'cancelado' && x.estado !== 'archivado')))
      .catch(() => setTurnosDia([]))

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

  const registrarVentaBarbero = async () => {
    setGuardandoVenta(true); setErrorVenta('')
    try {
      await api.post('/ventas', { idproducto: Number(formVenta.idproducto), cantidad: Number(formVenta.cantidad), metodo_pago: formVenta.metodo_pago })
      setModalVenta(false); setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' })
      api.get<ProductoVenta[]>('/productos').then(setProductosVenta).catch(() => {})
    } catch (e: unknown) { setErrorVenta(e instanceof Error ? e.message : 'Error') }
    finally { setGuardandoVenta(false) }
  }

  const abrirCobro = (t: TurnoPendienteCobro) => {
    setTurnoACobrar(t); setMontoCobro(String(t.servicio.precio)); setMetodoCobro('efectivo'); setErrorCobro(''); setModalCobro(true)
  }

  const registrarCobro = async () => {
    if (!turnoACobrar) return
    setGuardandoCobro(true); setErrorCobro('')
    try {
      await api.post('/pagos', { idagenda: turnoACobrar.idagenda, monto_pago: Number(montoCobro), metodo_pago: metodoCobro })
      setModalCobro(false); cargarPendientesCobro()
    } catch (e: unknown) { setErrorCobro(e instanceof Error ? e.message : 'Error') }
    finally { setGuardandoCobro(false) }
  }

  const turnosOrdenados = [...turnos].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
  const activos = turnosOrdenados.filter(t => t.estado !== 'atendido' && t.estado !== 'cobrado' && t.estado !== 'cancelado' && t.estado !== 'ausente')
  const proximo = activos[0]

  const hechos = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').length
  const pendientes = turnos.filter(t => t.estado === 'pendiente' || t.estado === 'confirmado').length
  const ingresos = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').reduce((a, t) => a + Number(t.servicio.precio), 0)
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
        {/* Volver al admin (solo owner) */}
        {(() => { try { const p = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])); return p.rol === 'owner' || p.rol === 'admin' } catch { return false } })() && (
          <a href="/admin" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LayoutDashboard className="size-3.5" />
            Volver al panel de administración
          </a>
        )}

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
        {ordenLlegada && (
          <button
            onClick={() => { setForm({ ...FORM_VACIO, fecha: hoyStr }); setError(''); cargarTurnosDia(hoyStr); setModal(true) }}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/20 py-3 text-sm text-muted-foreground transition-colors hover:bg-card/40"
          >
            <Plus className="size-4" />
            Registrar turno por orden de llegada
          </button>
        )}

        {/* Tabs */}
        {(() => {
          const tabs = ['hoy', 'agenda', 'stats', ...(perfil?.puede_cobrar ? ['caja'] : []), ...(perfil?.puede_vender ? ['productos'] : [])]
          return (
            <div className={`mb-4 grid rounded-xl border border-border/50 bg-card/20 p-1`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t as typeof tab)}
                  className={`rounded-lg py-2 text-xs sm:text-sm transition-colors ${tab === t ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t === 'hoy' ? 'Hoy' : t === 'agenda' ? 'Agenda' : t === 'stats' ? 'Stats' : t === 'caja' ? '💰 Caja' : '📦 Productos'}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Tab: Hoy */}
        {tab === 'hoy' && (
          <div className="space-y-2">
            {turnosOrdenados.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay turnos para hoy</p>
            ) : turnosOrdenados.map(t => {
              const est = ESTADO_BADGE[t.estado] ?? ESTADO_BADGE.pendiente
              const finalizado = t.estado === 'atendido' || t.estado === 'cobrado' || t.estado === 'ausente' || t.estado === 'cancelado'
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
                        <DropdownMenuItem onClick={() => abrirCancelacion(t)} className="text-destructive">
                          <XCircle className="mr-2 size-4" />Cancelar turno
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

        {/* Tab: Caja */}
        {tab === 'caja' && (
          <div className="space-y-2">
            {turnosPendientesCobro.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay turnos pendientes de cobro</p>
            ) : turnosPendientesCobro.map(t => (
              <div key={t.idagenda} className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio} · {t.hora_inicio.slice(0,5)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-yellow-500">${Number(t.servicio.precio).toLocaleString('es-AR')}</span>
                <Button size="sm" className="shrink-0 h-8 gap-1" onClick={() => abrirCobro(t)}>
                  <DollarSign className="size-3" />Cobrar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* Tab: Productos */}
        {tab === 'productos' && (
          <div className="space-y-3">
            <button onClick={() => { setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' }); setErrorVenta(''); setModalVenta(true) }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/20 py-3 text-sm text-muted-foreground hover:bg-card/40 transition-colors">
              <Plus className="size-4" />Registrar venta de producto
            </button>
            <div className="space-y-2">
              {productosVenta.map(p => (
                <div key={p.idproducto} className="flex items-center justify-between rounded-xl border border-border/30 bg-card/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.nombre_producto}</p>
                    <p className="text-xs text-muted-foreground">Stock: {p.stock_actual}</p>
                  </div>
                  <span className="font-bold text-primary">${Number(p.precio_venta).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Modal venta producto */}
      <Dialog open={modalVenta} onOpenChange={setModalVenta}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Venta de producto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select value={formVenta.idproducto} onValueChange={v => setFormVenta(p => ({ ...p, idproducto: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {productosVenta.filter(p => p.stock_actual > 0).map(p => (
                    <SelectItem key={p.idproducto} value={String(p.idproducto)}>
                      {p.nombre_producto} — ${Number(p.precio_venta).toLocaleString('es-AR')} (stock: {p.stock_actual})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input type="number" min="1" value={formVenta.cantidad} onChange={e => setFormVenta(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={formVenta.metodo_pago} onValueChange={v => setFormVenta(p => ({ ...p, metodo_pago: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo"><span className="flex items-center gap-2"><Banknote className="size-4" />Efectivo</span></SelectItem>
                  <SelectItem value="transferencia"><span className="flex items-center gap-2"><Smartphone className="size-4" />Transferencia</span></SelectItem>
                  <SelectItem value="tarjeta"><span className="flex items-center gap-2"><CreditCard className="size-4" />Tarjeta</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formVenta.idproducto && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 flex justify-between">
                <span className="text-sm">Total</span>
                <span className="font-bold text-primary">${((productosVenta.find(p => p.idproducto === Number(formVenta.idproducto))?.precio_venta ?? 0) * Number(formVenta.cantidad)).toLocaleString('es-AR')}</span>
              </div>
            )}
            {errorVenta && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorVenta}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalVenta(false)}>Cancelar</Button>
            <Button onClick={registrarVentaBarbero} disabled={guardandoVenta || !formVenta.idproducto}>{guardandoVenta ? 'Guardando...' : 'Confirmar venta'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cobro */}
      <Dialog open={modalCobro} onOpenChange={setModalCobro}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar cobro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{turnoACobrar?.cliente?.persona?.nombre_completo ?? 'Sin nombre'} · {turnoACobrar?.servicio?.nombre_servicio ?? ''}</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={montoCobro} onChange={e => setMontoCobro(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodoCobro} onValueChange={setMetodoCobro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo"><span className="flex items-center gap-2"><Banknote className="size-4" />Efectivo</span></SelectItem>
                  <SelectItem value="transferencia"><span className="flex items-center gap-2"><Smartphone className="size-4" />Transferencia</span></SelectItem>
                  <SelectItem value="tarjeta"><span className="flex items-center gap-2"><CreditCard className="size-4" />Tarjeta</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorCobro && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorCobro}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalCobro(false)}>Cancelar</Button>
            <Button onClick={registrarCobro} disabled={guardandoCobro || !montoCobro}>
              {guardandoCobro ? 'Guardando...' : 'Confirmar cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal cancelar turno con motivo */}
      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
          </DialogHeader>
          {turnoCancelar && (
            <p className="text-sm text-muted-foreground -mt-2">
              {turnoCancelar.cliente?.persona.nombre_completo ?? 'Sin nombre'} · {turnoCancelar.hora_inicio.slice(0,5)} hs · {turnoCancelar.servicio.nombre_servicio}
            </p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Motivo (opcional)</Label>
              <Textarea
                placeholder="Ej: No puedo atender por razones de salud, problemas con el local, etc."
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Si el cliente tiene email registrado, va a recibir un aviso con este motivo.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalCancelar(false)}>Volver</Button>
            <Button variant="destructive" onClick={confirmarCancelacion} disabled={guardandoCancelacion}>
              {guardandoCancelacion ? 'Cancelando...' : 'Confirmar cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  onChange={e => { setForm(p => ({...p, fecha: e.target.value})); cargarTurnosDia(e.target.value) }} required />
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
            {turnosDia.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turnos ya agendados ese día</p>
                {[...turnosDia].sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(t => (
                  <div key={t.idagenda} className="flex items-center gap-2 text-xs">
                    <span className="w-10 font-mono font-bold text-foreground">{t.hora_inicio.slice(0,5)}</span>
                    <span className="text-muted-foreground">–</span>
                    <span className="w-10 font-mono text-muted-foreground">{t.hora_fin.slice(0,5)}</span>
                    <span className="flex-1 truncate text-muted-foreground">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</span>
                    <span className="shrink-0 text-muted-foreground/70">{t.servicio.nombre_servicio}</span>
                  </div>
                ))}
              </div>
            )}
            {turnosDia.length === 0 && form.fecha && (
              <p className="text-xs text-green-500">Sin turnos agendados para ese día.</p>
            )}
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
  const atendidos = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').length
  const ingresos = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').reduce((a, t) => a + Number(t.servicio.precio), 0)
  const ausentes = turnos.filter(t => t.estado === 'ausente').length
  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

  const cuentaServ: Record<string, number> = {}
  turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').forEach(t => {
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
