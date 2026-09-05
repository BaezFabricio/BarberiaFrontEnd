'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle, XCircle, AlertCircle, DollarSign, Banknote, Smartphone,
  CreditCard, LayoutDashboard, Plus, ChevronRight, Star, TrendingUp,
  UserCheck, MoreVertical, Home, Calendar, BarChart2, Package, User, Scissors,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

// ── Tipos ─────────────────────────────────────────────────────────────────────

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
type Tab = 'hoy' | 'agenda' | 'stats' | 'caja' | 'productos'

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADO: Record<string, { label: string; dot: string; text: string }> = {
  pendiente:  { label: 'Reservado',   dot: 'bg-blue-400',   text: 'text-blue-400' },
  confirmado: { label: 'Confirmado',  dot: 'bg-yellow-400', text: 'text-yellow-400' },
  atendido:   { label: 'Falta cobrar',dot: 'bg-orange-400', text: 'text-orange-400' },
  cobrado:    { label: 'Cobrado',     dot: 'bg-green-400',  text: 'text-green-400' },
  ausente:    { label: 'Ausente',     dot: 'bg-orange-500', text: 'text-orange-500' },
  cancelado:  { label: 'Cancelado',   dot: 'bg-red-400',    text: 'text-red-400' },
}

const HORAS = Array.from({ length: 24 }, (_, h) =>
  ['00','15','30','45'].map(m => `${String(h).padStart(2,'0')}:${m}`)
).flat()

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const FORM0 = { nombre_cliente: '', telefono_cliente: '', hora_inicio: '', fecha: '' }

const hoyStr = () => new Date().toISOString().split('T')[0]
const fmt    = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

// ── Página ────────────────────────────────────────────────────────────────────

export default function BarberoPage() {
  const hoy = new Date()

  const [turnos, setTurnos]       = useState<Turno[]>([])
  const [perfil, setPerfil]       = useState<Perfil | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tab, setTab]             = useState<Tab>(() => {
    try { return (localStorage.getItem('barberoTab') as Tab) ?? 'hoy' } catch { return 'hoy' }
  })
  const [ordenLlegada, setOrdenLlegada] = useState(true)

  const [turnosPendientesCobro, setTurnosPendientesCobro] = useState<TurnoPendienteCobro[]>([])
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([])

  const [modalNuevo,    setModalNuevo]    = useState(false)
  const [serviciosNuevo, setServiciosNuevo] = useState<Servicio[]>([])
  const [pickerNuevo, setPickerNuevo]   = useState('')
  const [modalCancelar, setModalCancelar] = useState(false)
  const [modalCobro,    setModalCobro]    = useState(false)
  const [modalVenta,    setModalVenta]    = useState(false)

  const [form,      setForm]      = useState({ ...FORM0, fecha: hoyStr() })
  const [turnosDia, setTurnosDia] = useState<Turno[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const [turnoCancelar,        setTurnoCancelar]        = useState<Turno | null>(null)
  const [motivoCancelacion,    setMotivoCancelacion]    = useState('')
  const [guardandoCancelacion, setGuardandoCancelacion] = useState(false)
  const [agendaRefreshKey,     setAgendaRefreshKey]     = useState(0)

  const [turnoACobrar,   setTurnoACobrar]   = useState<TurnoPendienteCobro | null>(null)
  const [montoCobro,     setMontoCobro]     = useState('')
  const [metodoCobro,    setMetodoCobro]    = useState('efectivo')
  const [guardandoCobro, setGuardandoCobro] = useState(false)
  const [errorCobro,     setErrorCobro]     = useState('')

  const [formVenta,      setFormVenta]      = useState({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' })
  const [guardandoVenta, setGuardandoVenta] = useState(false)
  const [errorVenta,     setErrorVenta]     = useState('')

  const [modalSD, setModalSD]         = useState(false)
  const FORM_SD0_B = { nombre_cliente: '', hora_inicio: '', metodo_pago: 'efectivo', monto: '' }
  const [formSD,   setFormSD]         = useState(FORM_SD0_B)
  const [serviciosSD, setServiciosSD] = useState<Servicio[]>([])
  const [pickerSD, setPickerSD]       = useState('')
  const [guardandoSD, setGuardandoSD] = useState(false)
  const [errorSD,  setErrorSD]        = useState('')

  useEffect(() => { try { localStorage.setItem('barberoTab', tab) } catch { } }, [tab])

  const recargar = useCallback(() =>
    api.get<Turno[]>(`/turnos?fecha=${hoyStr()}`).then(setTurnos).catch(() => {}), [])

  const cargarPendientesCobro = () =>
    api.get<TurnoPendienteCobro[]>('/pagos/turnos-pendientes').then(setTurnosPendientesCobro).catch(() => {})

  useEffect(() => {
    recargar()
    api.get<Perfil>('/mi-perfil').then(p => {
      setPerfil(p)
      if (p.puede_cobrar) cargarPendientesCobro()
      if (p.puede_vender) api.get<ProductoVenta[]>('/productos').then(setProductosVenta).catch(() => {})
    }).catch(() => {})
    api.get<Servicio[]>('/servicios').then(setServicios).catch(() => {})
    api.get<ConfigBarberia>('/mi-barberia').then(d => setOrdenLlegada(d.orden_llegada ?? true)).catch(() => {})
  }, [recargar])

  const cambiarEstado = async (id: number, estado: string) => {
    await api.patch(`/turnos/${id}/estado`, { estado })
    recargar()
    setAgendaRefreshKey(k => k + 1)
  }

  const abrirCancelacion = (t: Turno) => { setTurnoCancelar(t); setMotivoCancelacion(''); setModalCancelar(true) }
  const confirmarCancelacion = async () => {
    if (!turnoCancelar) return
    setGuardandoCancelacion(true)
    try {
      await api.patch(`/turnos/${turnoCancelar.idagenda}/cancelar`, { motivo: motivoCancelacion })
      setModalCancelar(false); recargar(); setAgendaRefreshKey(k => k + 1)
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error al cancelar') }
    finally { setGuardandoCancelacion(false) }
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (serviciosNuevo.length === 0) return setError('Seleccioná al menos un servicio.')
    if (!form.nombre_cliente || !form.hora_inicio || !form.fecha) return setError('Completá los campos obligatorios.')
    const duracionTotal = serviciosNuevo.reduce((s, x) => s + x.duracion_minutos, 0)
    const [h, m] = form.hora_inicio.split(':').map(Number)
    const finMin = h * 60 + m + duracionTotal
    const hora_fin = `${String(Math.floor(finMin/60)).padStart(2,'0')}:${String(finMin%60).padStart(2,'0')}`
    setGuardando(true)
    try {
      await api.post('/turnos', {
        ...form,
        idservicio: serviciosNuevo[0].idservicio,
        servicios_ids: serviciosNuevo.map(s => s.idservicio),
        hora_fin,
        tipo_alta: 'orden_de_llegada',
      })
      setModalNuevo(false); setForm({ ...FORM0, fecha: hoyStr() }); setServiciosNuevo([]); setPickerNuevo(''); recargar()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al guardar.') }
    finally { setGuardando(false) }
  }

  const ahoraStr = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
  const hoyBarbero = () => new Date().toISOString().split('T')[0]

  const registrarServicioDirectoBarbero = async () => {
    setGuardandoSD(true); setErrorSD('')
    try {
      if (serviciosSD.length === 0) throw new Error('Seleccioná al menos un servicio.')
      if (!formSD.hora_inicio) throw new Error('Ingresá la hora.')
      const duracionTotal = serviciosSD.reduce((s, x) => s + x.duracion_minutos, 0)
      const [h, m] = formSD.hora_inicio.split(':').map(Number)
      const finMin = h * 60 + m + duracionTotal
      const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`
      const turno = await api.post<{ idagenda: number }>('/turnos', {
        idservicio: serviciosSD[0].idservicio,
        servicios_ids: serviciosSD.map(s => s.idservicio),
        nombre_cliente: formSD.nombre_cliente || 'Cliente',
        fecha: hoyBarbero(),
        hora_inicio: formSD.hora_inicio,
        hora_fin,
        tipo_alta: 'orden_de_llegada',
      })
      await api.post('/pagos', { idagenda: turno.idagenda, monto_pago: Number(formSD.monto), metodo_pago: formSD.metodo_pago })
      setModalSD(false); setFormSD(FORM_SD0_B); setServiciosSD([]); setPickerSD(''); recargar(); cargarPendientesCobro()
    } catch (e: unknown) { setErrorSD(e instanceof Error ? e.message : 'Error al registrar') }
    finally { setGuardandoSD(false) }
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
  const activos    = turnosOrdenados.filter(t => !['atendido','cobrado','cancelado','ausente'].includes(t.estado))
  const proximo    = activos[0]
  const hechos     = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').length
  const pendientes = turnos.filter(t => t.estado === 'pendiente' || t.estado === 'confirmado').length
  const ingresos   = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').reduce((a, t) => a + Number(t.servicio.precio), 0)

  const tiempoHastaProximo = proximo ? (() => {
    const [ph, pm] = proximo.hora_inicio.split(':').map(Number)
    const diff = (ph * 60 + pm) - (hoy.getHours() * 60 + hoy.getMinutes())
    if (diff <= 0) return 'Ahora'
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff/60)}h ${diff % 60 > 0 ? `${diff % 60}min` : ''}`
  })() : null

  const isOwnerOrAdmin = (() => {
    try { const p = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1])); return p.rol === 'owner' || p.rol === 'admin' } catch { return false }
  })()

  const proximosDias = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return { fecha: d.toISOString().split('T')[0], label: `${DIAS[d.getDay()]} ${d.getDate()}` }
  })

  // Nav items
  const navItems: { id: Tab; icon: React.ReactNode; label: string; show: boolean }[] = [
    { id: 'hoy',      icon: <Home className="size-5" />,      label: 'Hoy',      show: true },
    { id: 'agenda',   icon: <Calendar className="size-5" />,  label: 'Agenda',   show: true },
    { id: 'stats',    icon: <BarChart2 className="size-5" />, label: 'Stats',    show: true },
    { id: 'caja',     icon: <DollarSign className="size-5" />,label: 'Caja',     show: !!perfil?.puede_cobrar },
    { id: 'productos',icon: <Package className="size-5" />,   label: 'Productos',show: !!perfil?.puede_vender },
  ]
  const visibleNav = navItems.filter(n => n.show)

  // ── Secciones de contenido reutilizables ────────────────────────────────────

  const SeccionStats = () => (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { val: hechos,        label: 'Hechos',    color: 'text-green-400' },
        { val: pendientes,    label: 'Pendientes',color: 'text-blue-400' },
        { val: fmt(ingresos), label: 'Hoy',       color: 'text-primary' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border border-border/40 bg-card/40 p-3 text-center">
          <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )

  const SeccionProximo = () => proximo ? (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4 mb-4">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
        <p className="text-3xl font-black tabular-nums">{proximo.hora_inicio.slice(0,5)}</p>
        <p className="text-xs font-medium text-primary">{tiempoHastaProximo}</p>
      </div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">Próximo</p>
      <p className="max-w-[60%] truncate font-semibold">{proximo.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
      <p className="max-w-[60%] truncate text-sm text-muted-foreground">{proximo.servicio.nombre_servicio}</p>
    </div>
  ) : null

  const SeccionTurnosHoy = () => (
    <div className="space-y-2">
      {turnosOrdenados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin turnos para hoy</p>
      ) : turnosOrdenados.map(t => {
        const est = ESTADO[t.estado] ?? ESTADO.pendiente
        const finalizado = ['atendido','cobrado','ausente','cancelado'].includes(t.estado)
        return (
          <div key={t.idagenda} className={cn('flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-3 py-3 transition-opacity', finalizado && 'opacity-40')}>
            <div className="shrink-0 w-10 text-center">
              <p className="text-sm font-bold tabular-nums">{t.hora_inicio.slice(0,5)}</p>
              <p className="text-[9px] text-muted-foreground">{t.hora_fin.slice(0,5)}</p>
            </div>
            <div className="w-px h-7 bg-border/50 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
              <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={cn('size-2 rounded-full', est.dot)} />
              {!finalizado && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {t.estado === 'pendiente' && (
                      <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'confirmado')}>
                        <CheckCircle className="mr-2 size-4 text-yellow-400" />Confirmar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'atendido')}>
                      <UserCheck className="mr-2 size-4 text-green-400" />Marcar atendido
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => cambiarEstado(t.idagenda, 'ausente')}>
                      <AlertCircle className="mr-2 size-4 text-orange-400" />Ausente
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => abrirCancelacion(t)} className="text-destructive">
                      <XCircle className="mr-2 size-4" />Cancelar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const SeccionAgendaDias = () => (
    <div className="space-y-4">
      {proximosDias.map(d => (
        <AgendaDia key={d.fecha} fecha={d.fecha} label={d.label} refreshKey={agendaRefreshKey} onCambiarEstado={cambiarEstado} onCancelar={abrirCancelacion} />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background md:flex">

      {/* ── Sidebar desktop ──────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 border-r border-border/40 bg-card/30 sticky top-0 h-screen shrink-0">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
          <div className="size-9 rounded-full bg-primary/20 ring-2 ring-primary/30 flex items-center justify-center overflow-hidden shrink-0">
            {perfil?.foto_url
              ? <img src={perfil.foto_url} alt="" className="size-9 object-cover" />
              : <span className="text-xs font-bold text-primary">{perfil ? initials(perfil.nombre_completo) : '..'}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{perfil?.nombre_completo.split(' ')[0] ?? '...'}</p>
            <p className="text-xs text-muted-foreground">Barbero</p>
          </div>
        </div>
        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
          {visibleNav.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left w-full',
                tab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        {/* Bottom: perfil + admin */}
        <div className="flex flex-col gap-0.5 px-2 py-3 border-t border-border/40">
          {isOwnerOrAdmin && (
            <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <LayoutDashboard className="size-5" />
              <span className="text-sm font-medium">Admin</span>
            </a>
          )}
          <a href="/barbero/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <User className="size-5" />
            <span className="text-sm font-medium">Mi perfil</span>
          </a>
        </div>
      </aside>

      {/* ── Contenido principal ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Topbar */}
        <header className="border-b border-border/40 bg-card/30 px-4 py-3 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar solo en móvil */}
            <div className="size-9 rounded-full bg-primary/20 ring-2 ring-primary/30 flex items-center justify-center overflow-hidden md:hidden shrink-0">
              {perfil?.foto_url
                ? <img src={perfil.foto_url} alt="" className="size-9 object-cover" />
                : <span className="text-xs font-bold text-primary">{perfil ? initials(perfil.nombre_completo) : '..'}</span>
              }
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{DIAS[hoy.getDay()]}, {hoy.getDate()} de {MESES[hoy.getMonth()]}</p>
              <h1 className="text-lg font-bold leading-tight md:text-xl">Hola, {perfil?.nombre_completo.split(' ')[0] ?? '...'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(perfil?.rating_promedio ?? 0) > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{Number(perfil?.rating_promedio ?? 0).toFixed(1)}</span>
              </div>
            )}
            {ordenLlegada && (
              <Button size="sm" variant="outline" className="gap-1.5 hidden md:flex"
                onClick={() => { setForm({ ...FORM0, fecha: hoyStr() }); setError(''); setTurnosDia([]); setServiciosNuevo([]); setPickerNuevo(''); setModalNuevo(true) }}>
                <Plus className="size-3.5" />Nuevo turno
              </Button>
            )}
          </div>
        </header>

        {/* Contenido según tab */}
        <main className="flex-1 overflow-auto">

          {/* ── HOY ── */}
          {tab === 'hoy' && (
            <div className="md:flex md:h-full">
              {/* Columna izquierda: stats + turnos */}
              <div className="md:w-80 md:border-r md:border-border/40 md:overflow-y-auto p-4 md:p-5">
                <SeccionStats />
                {/* Botón móvil orden de llegada */}
                {ordenLlegada && (
                  <button
                    onClick={() => { setForm({ ...FORM0, fecha: hoyStr() }); setError(''); setTurnosDia([]); setServiciosNuevo([]); setPickerNuevo(''); setModalNuevo(true) }}
                    className="md:hidden flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-2.5 text-sm text-muted-foreground mb-4 hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <Plus className="size-4" />Registrar por orden de llegada
                  </button>
                )}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Turnos de hoy</p>
                <SeccionTurnosHoy />
              </div>
              {/* Columna derecha: próximo + agenda (solo desktop) */}
              <div className="hidden md:block flex-1 overflow-y-auto p-5">
                <SeccionProximo />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos días</p>
                <SeccionAgendaDias />
              </div>
              {/* Próximo en móvil (debajo de turnos) */}
              <div className="md:hidden px-4 pb-4">
                <SeccionProximo />
              </div>
            </div>
          )}

          {/* ── AGENDA ── */}
          {tab === 'agenda' && (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {proximosDias.map(d => (
                  <AgendaDia key={d.fecha} fecha={d.fecha} label={d.label} refreshKey={agendaRefreshKey} onCambiarEstado={cambiarEstado} onCancelar={abrirCancelacion} />
                ))}
              </div>
            </div>
          )}

          {/* ── STATS ── */}
          {tab === 'stats' && (
            <div className="p-4 md:p-6">
              <StatsTab turnos={turnos} perfil={perfil} />
            </div>
          )}

          {/* ── CAJA ── */}
          {tab === 'caja' && (
            <div className="p-4 md:p-6 space-y-2">
              <button
                onClick={() => { setErrorSD(''); setFormSD({ ...FORM_SD0_B, hora_inicio: ahoraStr() }); setServiciosSD([]); setPickerSD(''); setModalSD(true) }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors mb-2"
              >
                <Scissors className="size-4" />Cobro rápido (sin turno)
              </button>
              {turnosPendientesCobro.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin turnos pendientes de cobro</p>
              ) : turnosPendientesCobro.map(t => (
                <div key={t.idagenda} className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio} · {t.hora_inicio.slice(0,5)}</p>
                  </div>
                  <span className="shrink-0 font-bold text-primary">${Number(t.servicio.precio).toLocaleString('es-AR')}</span>
                  <Button size="sm" className="h-8 shrink-0 gap-1" onClick={() => abrirCobro(t)}>
                    <DollarSign className="size-3" />Cobrar
                  </Button>
                </div>
              ))}
              {turnos.filter(t => t.estado === 'cobrado').length > 0 && (
                <div className="mt-4">
                  <p className="px-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cobrados hoy</p>
                  {turnos.filter(t => t.estado === 'cobrado').sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(t => (
                    <div key={t.idagenda} className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 mb-2">
                      <CheckCircle className="size-4 shrink-0 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio} · {t.hora_inicio.slice(0,5)}</p>
                      </div>
                      <span className="shrink-0 font-bold text-green-500">${Number(t.servicio.precio).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTOS ── */}
          {tab === 'productos' && (
            <div className="p-4 md:p-6 space-y-3">
              <button onClick={() => { setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' }); setErrorVenta(''); setModalVenta(true) }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                <Plus className="size-4" />Registrar venta
              </button>
              <div className="space-y-2">
                {productosVenta.map(p => (
                  <div key={p.idproducto} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-4 py-3">
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
        </main>
      </div>

      {/* ── Bottom nav móvil ─────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex border-t border-border/40 bg-background/95 backdrop-blur-sm">
        {visibleNav.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors',
              tab === item.id ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}

      {/* Cobro rápido */}
      <Dialog open={modalSD} onOpenChange={setModalSD}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cobro rápido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Servicios</Label>
              <Select value={pickerSD} onValueChange={v => {
                const s = servicios.find(x => x.idservicio === Number(v))
                if (s && !serviciosSD.find(x => x.idservicio === s.idservicio)) {
                  const next = [...serviciosSD, s]
                  setServiciosSD(next)
                  setFormSD(p => ({ ...p, monto: String(next.reduce((a, x) => a + x.precio, 0)) }))
                }
                setPickerSD('')
              }}>
                <SelectTrigger><SelectValue placeholder="Agregar servicio…" /></SelectTrigger>
                <SelectContent>
                  {servicios.filter(s => !serviciosSD.find(x => x.idservicio === s.idservicio)).map(s => (
                    <SelectItem key={s.idservicio} value={String(s.idservicio)}>
                      {s.nombre_servicio} — ${Number(s.precio).toLocaleString('es-AR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serviciosSD.length > 0 && (
                <div className="space-y-1 mt-1">
                  {serviciosSD.map(s => (
                    <div key={s.idservicio} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                      <span>{s.nombre_servicio} <span className="text-muted-foreground">({s.duracion_minutos}min)</span></span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${Number(s.precio).toLocaleString('es-AR')}</span>
                        <button type="button" className="text-muted-foreground hover:text-destructive text-base leading-none"
                          onClick={() => {
                            const next = serviciosSD.filter(x => x.idservicio !== s.idservicio)
                            setServiciosSD(next)
                            setFormSD(p => ({ ...p, monto: String(next.reduce((a, x) => a + x.precio, 0)) }))
                          }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del cliente <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input placeholder="Juan García" value={formSD.nombre_cliente}
                onChange={e => setFormSD(p => ({ ...p, nombre_cliente: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={formSD.hora_inicio} onChange={e => setFormSD(p => ({ ...p, hora_inicio: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input type="number" min="0" value={formSD.monto} onChange={e => setFormSD(p => ({ ...p, monto: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={formSD.metodo_pago} onValueChange={v => setFormSD(p => ({ ...p, metodo_pago: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo"><span className="flex items-center gap-2"><Banknote className="size-4" />Efectivo</span></SelectItem>
                  <SelectItem value="transferencia"><span className="flex items-center gap-2"><Smartphone className="size-4" />Transferencia</span></SelectItem>
                  <SelectItem value="tarjeta"><span className="flex items-center gap-2"><CreditCard className="size-4" />Tarjeta</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorSD && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorSD}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalSD(false)}>Cancelar</Button>
            <Button onClick={registrarServicioDirectoBarbero}
              disabled={guardandoSD || serviciosSD.length === 0 || !formSD.hora_inicio || !formSD.monto}>
              {guardandoSD ? 'Registrando...' : 'Cobrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalCancelar} onOpenChange={v => { if (!guardandoCancelacion) setModalCancelar(v) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cancelar turno</DialogTitle></DialogHeader>
          {turnoCancelar && (
            <p className="text-sm text-muted-foreground -mt-2">
              {turnoCancelar.cliente?.persona.nombre_completo ?? 'Sin nombre'} · {turnoCancelar.hora_inicio.slice(0,5)} hs · {turnoCancelar.servicio.nombre_servicio}
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Motivo (opcional)</Label>
            <Textarea placeholder="Ej: No puedo atender ese día." value={motivoCancelacion}
              onChange={e => setMotivoCancelacion(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground">Si el cliente tiene email, va a recibir un aviso.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalCancelar(false)}>Volver</Button>
            <Button variant="destructive" onClick={confirmarCancelacion} disabled={guardandoCancelacion}>
              {guardandoCancelacion ? 'Cancelando...' : 'Confirmar cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalCobro} onOpenChange={setModalCobro}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Registrar cobro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{turnoACobrar?.cliente?.persona?.nombre_completo ?? 'Sin nombre'} · {turnoACobrar?.servicio?.nombre_servicio}</p>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Monto</Label>
              <Input type="number" value={montoCobro} onChange={e => setMontoCobro(e.target.value)} />
            </div>
            <div className="space-y-1.5"><Label>Método de pago</Label>
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

      <Dialog open={modalVenta} onOpenChange={setModalVenta}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Venta de producto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Producto</Label>
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
            <div className="space-y-1.5"><Label>Cantidad</Label>
              <Input type="number" min="1" value={formVenta.cantidad} onChange={e => setFormVenta(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
            <div className="space-y-1.5"><Label>Método de pago</Label>
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
              <div className="flex justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                <span className="text-sm">Total</span>
                <span className="font-bold text-primary">${((productosVenta.find(p => p.idproducto === Number(formVenta.idproducto))?.precio_venta ?? 0) * Number(formVenta.cantidad)).toLocaleString('es-AR')}</span>
              </div>
            )}
            {errorVenta && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorVenta}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalVenta(false)}>Cancelar</Button>
            <Button onClick={registrarVentaBarbero} disabled={guardandoVenta || !formVenta.idproducto}>
              {guardandoVenta ? 'Guardando...' : 'Confirmar venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Turno</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4 py-2">
            <div className="grid gap-2"><Label>Nombre del cliente *</Label>
              <Input placeholder="Ej: Juan Perez" value={form.nombre_cliente}
                onChange={e => setForm(p => ({...p, nombre_cliente: e.target.value}))} required />
            </div>
            <div className="grid gap-2"><Label>Teléfono</Label>
              <Input placeholder="+54 11 1234-5678" value={form.telefono_cliente}
                onChange={e => setForm(p => ({...p, telefono_cliente: e.target.value}))} />
            </div>
            <div className="grid gap-2"><Label>Servicios *</Label>
              <Select value={pickerNuevo} onValueChange={v => {
                const s = servicios.find(x => x.idservicio === Number(v))
                if (s && !serviciosNuevo.find(x => x.idservicio === s.idservicio)) setServiciosNuevo(p => [...p, s])
                setPickerNuevo('')
              }}>
                <SelectTrigger><SelectValue placeholder="Agregar servicio…" /></SelectTrigger>
                <SelectContent>
                  {servicios.filter(s => !serviciosNuevo.find(x => x.idservicio === s.idservicio)).map(s => (
                    <SelectItem key={s.idservicio} value={String(s.idservicio)}>
                      {s.nombre_servicio} ({s.duracion_minutos} min) — ${Number(s.precio).toLocaleString('es-AR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serviciosNuevo.length > 0 && (
                <div className="space-y-1">
                  {serviciosNuevo.map(s => (
                    <div key={s.idservicio} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                      <span>{s.nombre_servicio} <span className="text-muted-foreground">({s.duracion_minutos}min)</span></span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${Number(s.precio).toLocaleString('es-AR')}</span>
                        <button type="button" className="text-muted-foreground hover:text-destructive text-base leading-none"
                          onClick={() => setServiciosNuevo(p => p.filter(x => x.idservicio !== s.idservicio))}>×</button>
                      </div>
                    </div>
                  ))}
                  {serviciosNuevo.length > 1 && (
                    <div className="flex justify-between px-3 py-1 text-sm font-semibold border-t">
                      <span>Total</span>
                      <span>${serviciosNuevo.reduce((a,s)=>a+s.precio,0).toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Fecha *</Label>
                <Input type="date" value={form.fecha} min={hoyStr()}
                  onChange={e => {
                    setForm(p => ({...p, fecha: e.target.value}))
                    api.get<Turno[]>(`/turnos?fecha=${e.target.value}`)
                      .then(t => setTurnosDia(t.filter(x => !['cancelado','archivado'].includes(x.estado))))
                      .catch(() => setTurnosDia([]))
                  }} required />
              </div>
              <div className="grid gap-2"><Label>Hora *</Label>
                <Select value={form.hora_inicio} onValueChange={v => setForm(p => ({...p, hora_inicio: v}))}>
                  <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {HORAS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {turnosDia.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ya agendados ese día</p>
                {[...turnosDia].sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(t => (
                  <div key={t.idagenda} className="flex items-center gap-2 text-xs">
                    <span className="w-10 font-mono font-bold">{t.hora_inicio.slice(0,5)}</span>
                    <span className="text-muted-foreground">–</span>
                    <span className="w-10 font-mono text-muted-foreground">{t.hora_fin.slice(0,5)}</span>
                    <span className="flex-1 truncate text-muted-foreground">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</span>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Crear turno'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── AgendaDia ─────────────────────────────────────────────────────────────────

function AgendaDia({
  fecha, label, refreshKey,
  onCambiarEstado, onCancelar,
}: {
  fecha: string; label: string; refreshKey: number
  onCambiarEstado: (id: number, estado: string) => Promise<void>
  onCancelar: (t: Turno) => void
}) {
  const [turnos, setTurnos] = useState<Turno[] | null>(null)

  const recargar = useCallback(() =>
    api.get<Turno[]>(`/turnos?fecha=${fecha}`)
      .then(data => setTurnos([...data].sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio))))
      .catch(() => setTurnos([])), [fecha])

  useEffect(() => { recargar() }, [recargar, refreshKey])

  const accion = async (id: number, estado: string) => { await onCambiarEstado(id, estado); recargar() }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {turnos === null ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : turnos.length === 0 ? (
        <p className="rounded-xl border border-border/30 bg-card/20 py-3 text-center text-xs text-muted-foreground">Sin turnos</p>
      ) : (
        <div className="space-y-2">
          {turnos.map(t => {
            const est = ESTADO[t.estado] ?? ESTADO.pendiente
            const finalizado = ['atendido','cobrado','ausente','cancelado'].includes(t.estado)
            return (
              <div key={t.idagenda} className={cn('flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-3 py-3 transition-opacity', finalizado && 'opacity-40')}>
                <div className="shrink-0 w-10 text-center">
                  <p className="text-sm font-bold tabular-nums">{t.hora_inicio.slice(0,5)}</p>
                  <p className="text-[9px] text-muted-foreground">{t.hora_fin.slice(0,5)}</p>
                </div>
                <div className="w-px h-7 bg-border/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{t.cliente?.persona.nombre_completo ?? 'Sin nombre'}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.servicio.nombre_servicio}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('text-xs hidden sm:inline', est.text)}>{est.label}</span>
                  <div className={cn('size-2 rounded-full', est.dot)} />
                  {!finalizado && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                          <ChevronRight className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {t.estado === 'pendiente' && (
                          <DropdownMenuItem onClick={() => accion(t.idagenda, 'confirmado')}>
                            <CheckCircle className="mr-2 size-4 text-yellow-400" />Confirmar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => accion(t.idagenda, 'atendido')}>
                          <UserCheck className="mr-2 size-4 text-green-400" />Marcar atendido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onCancelar(t)} className="text-destructive">
                          <XCircle className="mr-2 size-4" />Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── StatsTab ──────────────────────────────────────────────────────────────────

function StatsTab({ turnos, perfil }: { turnos: Turno[]; perfil: Perfil | null }) {
  const atendidos = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').length
  const ingresos  = turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado').reduce((a, t) => a + Number(t.servicio.precio), 0)
  const ausentes  = turnos.filter(t => t.estado === 'ausente').length
  const fmt       = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

  const cuentaServ: Record<string, number> = {}
  turnos.filter(t => t.estado === 'atendido' || t.estado === 'cobrado')
    .forEach(t => { cuentaServ[t.servicio.nombre_servicio] = (cuentaServ[t.servicio.nombre_servicio] ?? 0) + 1 })
  const maxServ = Math.max(...Object.values(cuentaServ), 1)
  const serviciosOrden = Object.entries(cuentaServ).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <UserCheck className="size-4 text-green-400" />, val: atendidos, label: 'Atendidos hoy', color: 'text-green-400' },
          { icon: <TrendingUp className="size-4 text-primary" />,  val: fmt(ingresos), label: 'Ingresos hoy', color: 'text-primary' },
          { icon: <Star className="size-4 text-yellow-400 fill-yellow-400" />, val: Number(perfil?.rating_promedio ?? 0).toFixed(1), label: 'Calificación', color: 'text-yellow-400' },
          { icon: <AlertCircle className="size-4 text-orange-400" />, val: ausentes, label: 'Ausencias', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-card/40 p-4">
            <div className="mb-2 flex items-center gap-1.5">{s.icon}<p className="text-xs text-muted-foreground">{s.label}</p></div>
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>
      {serviciosOrden.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-4">
          <p className="text-sm font-bold">Servicios realizados</p>
          {serviciosOrden.map(([nombre, count]) => (
            <div key={nombre}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm">{nombre}</span>
                <span className="text-sm font-bold text-primary">{count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/30">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(count / maxServ) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
