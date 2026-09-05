'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DollarSign, CreditCard, Banknote, Smartphone, Plus, Scissors, Calendar, ShoppingBag, ArrowDownCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

type Turno = {
  idagenda: number
  fecha: string
  hora_inicio: string
  servicio: { nombre_servicio: string; precio: number }
  cliente: { persona: { nombre_completo: string } }
  barbero: { persona: { nombre_completo: string } }
}

type Pago = {
  idpago: number
  monto_pago: string
  metodo_pago: string
  fecha_pago: string
  agenda_turno: Turno
}

type Resumen = { total: number; efectivo: number; transferencia: number; tarjeta: number; cantidad: number }
type Producto = { idproducto: number; nombre_producto: string; precio_venta: number; stock_actual: number }
type Venta = {
  idventa: number; cantidad: number; monto_total: string; metodo_pago: string; fecha_venta: string
  producto: { nombre_producto: string }
  barbero: { persona: { nombre_completo: string } }
  cliente?: { persona: { nombre_completo: string } }
}
type BarberoItem = { idusuario: number; persona: { nombre_completo: string } }
type ServicioItem = { idservicio: number; nombre_servicio: string; precio: number; duracion_minutos: number }
type Retiro = {
  idretiro: number; monto: string; descripcion: string | null; estado: 'pendiente' | 'devuelto'
  fecha_retiro: string; fecha_devolucion: string | null
  barbero: { idusuario: number; persona: { nombre_completo: string } }
}

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
const ahoraStr = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
const fmtFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const hoy = () => new Date().toISOString().split('T')[0]

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [pendientes, setPendientes] = useState<Turno[]>([])
  const [resumen, setResumen] = useState<Resumen>({ total: 0, efectivo: 0, transferencia: 0, tarjeta: 0, cantidad: 0 })
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [modal, setModal] = useState(false)
  const [turnoSel, setTurnoSel] = useState<Turno | null>(null)
  const [metodo, setMetodo] = useState<string>('efectivo')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [tabActivo, setTabActivo] = useState<'servicios' | 'productos'>('servicios')

  // Ventas de productos
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [modalVenta, setModalVenta] = useState(false)
  const [formVenta, setFormVenta] = useState({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' })
  const [guardandoVenta, setGuardandoVenta] = useState(false)
  const [errorVenta, setErrorVenta] = useState('')

  const [retiros, setRetiros] = useState<Retiro[]>([])
  const [modalRetiro, setModalRetiro] = useState(false)
  const [formRetiro, setFormRetiro] = useState({ idusuario_barbero: '', monto: '', descripcion: '' })
  const [guardandoRetiro, setGuardandoRetiro] = useState(false)
  const [errorRetiro, setErrorRetiro] = useState('')
  const [cobrando, setCobrando] = useState<number | null>(null)

  const [modalSD, setModalSD] = useState(false)
  const [barberosList, setBarberosList] = useState<BarberoItem[]>([])
  const [serviciosList, setServiciosList] = useState<ServicioItem[]>([])
  const FORM_SD0 = { idusuario_barbero: '', nombre_cliente: '', fecha: hoy(), hora_inicio: '', metodo_pago: 'efectivo', monto: '' }
  const [formSD, setFormSD] = useState(FORM_SD0)
  const [serviciosSD, setServiciosSD] = useState<ServicioItem[]>([])
  const [pickerSD, setPickerSD] = useState('')
  const [guardandoSD, setGuardandoSD] = useState(false)
  const [errorSD, setErrorSD] = useState('')

  const cargar = async () => {
    try {
      const [p, r, v] = await Promise.all([
        api.get<Pago[]>(`/pagos?desde=${desde}&hasta=${hasta}`),
        api.get<Resumen>(`/pagos/resumen?desde=${desde}&hasta=${hasta}`),
        api.get<Venta[]>(`/ventas?desde=${desde}&hasta=${hasta}`),
      ])
      setPagos(p); setResumen(r); setVentas(v)
    } catch { setPagos([]); setResumen({ total: 0, efectivo: 0, transferencia: 0, tarjeta: 0, cantidad: 0 }); setVentas([]) }
  }

  const cargarProductos = async () => {
    try { setProductos(await api.get<Producto[]>('/productos')) } catch { setProductos([]) }
  }

  const cargarPendientes = async () => {
    try { setPendientes(await api.get<Turno[]>('/pagos/turnos-pendientes')) }
    catch { setPendientes([]) }
  }

  useEffect(() => { cargar() }, [desde, hasta])
  const cargarRetiros = () => api.get<Retiro[]>('/retiros').then(setRetiros).catch(() => {})

  useEffect(() => {
    cargarPendientes(); cargarProductos(); cargarRetiros()
    api.get<BarberoItem[]>('/barberos').then(setBarberosList).catch(() => {})
    api.get<ServicioItem[]>('/servicios').then(setServiciosList).catch(() => {})
  }, [])

  const registrarRetiro = async () => {
    setGuardandoRetiro(true); setErrorRetiro('')
    try {
      await api.post('/retiros', { idusuario_barbero: Number(formRetiro.idusuario_barbero), monto: Number(formRetiro.monto), descripcion: formRetiro.descripcion || undefined })
      setModalRetiro(false); setFormRetiro({ idusuario_barbero: '', monto: '', descripcion: '' }); cargarRetiros()
    } catch (e: unknown) { setErrorRetiro(e instanceof Error ? e.message : 'Error') }
    finally { setGuardandoRetiro(false) }
  }

  const cobrarRetiro = async (idretiro: number) => {
    setCobrando(idretiro)
    try { await api.patch(`/retiros/${idretiro}/cobrar`, {}); cargarRetiros() }
    catch { }
    finally { setCobrando(null) }
  }

  const retirosPendientesPorBarbero = barberosList.map(b => ({
    barbero: b,
    pendiente: retiros.filter(r => r.barbero?.idusuario === b.idusuario && r.estado === 'pendiente').reduce((s, r) => s + parseFloat(r.monto), 0),
    items: retiros.filter(r => r.barbero?.idusuario === b.idusuario),
  })).filter(x => x.items.length > 0)

  const registrarServicioDirecto = async () => {
    setGuardandoSD(true); setErrorSD('')
    try {
      if (serviciosSD.length === 0) throw new Error('Seleccioná al menos un servicio.')
      if (!formSD.hora_inicio) throw new Error('Ingresá la hora.')
      const duracionTotal = serviciosSD.reduce((s, x) => s + x.duracion_minutos, 0)
      const [h, m] = formSD.hora_inicio.split(':').map(Number)
      const finMin = h * 60 + m + duracionTotal
      const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`
      const turno = await api.post<{ idagenda: number }>('/turnos', {
        idusuario_barbero: Number(formSD.idusuario_barbero),
        idservicio: serviciosSD[0].idservicio,
        servicios_ids: serviciosSD.map(s => s.idservicio),
        nombre_cliente: formSD.nombre_cliente || 'Cliente',
        fecha: formSD.fecha,
        hora_inicio: formSD.hora_inicio,
        hora_fin,
        tipo_alta: 'orden_de_llegada',
      })
      await api.post('/pagos', { idagenda: turno.idagenda, monto_pago: Number(formSD.monto), metodo_pago: formSD.metodo_pago })
      setModalSD(false); setFormSD(FORM_SD0); setServiciosSD([]); setPickerSD(''); cargar(); cargarPendientes()
    } catch (e: unknown) { setErrorSD(e instanceof Error ? e.message : 'Error al registrar') }
    finally { setGuardandoSD(false) }
  }

  const registrarVenta = async () => {
    setGuardandoVenta(true); setErrorVenta('')
    try {
      await api.post('/ventas', { idproducto: Number(formVenta.idproducto), cantidad: Number(formVenta.cantidad), metodo_pago: formVenta.metodo_pago })
      setModalVenta(false); setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' }); cargar(); cargarProductos()
    } catch (e: unknown) { setErrorVenta(e instanceof Error ? e.message : 'Error') }
    finally { setGuardandoVenta(false) }
  }

  const productoSel = productos.find(p => p.idproducto === Number(formVenta.idproducto))

  const resumenServicios = {
    total: pagos.reduce((s, p) => s + parseFloat(String(p.monto_pago)), 0),
    efectivo: pagos.filter(p => p.metodo_pago === 'efectivo').reduce((s, p) => s + parseFloat(String(p.monto_pago)), 0),
    transferencia: pagos.filter(p => p.metodo_pago === 'transferencia').reduce((s, p) => s + parseFloat(String(p.monto_pago)), 0),
    tarjeta: pagos.filter(p => p.metodo_pago === 'tarjeta').reduce((s, p) => s + parseFloat(String(p.monto_pago)), 0),
    cantidad: pagos.length,
  }
  const resumenProductos = {
    total: ventas.reduce((s, v) => s + parseFloat(String(v.monto_total)), 0),
    efectivo: ventas.filter(v => v.metodo_pago === 'efectivo').reduce((s, v) => s + parseFloat(String(v.monto_total)), 0),
    transferencia: ventas.filter(v => v.metodo_pago === 'transferencia').reduce((s, v) => s + parseFloat(String(v.monto_total)), 0),
    tarjeta: ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((s, v) => s + parseFloat(String(v.monto_total)), 0),
    cantidad: ventas.length,
  }
  const resumenActivo = tabActivo === 'servicios' ? resumenServicios : resumenProductos

  const abrirModal = (t: Turno) => {
    setTurnoSel(t)
    setMonto(String(t.servicio.precio))
    setMetodo('efectivo')
    setError('')
    setModal(true)
  }

  const registrarPago = async () => {
    if (!turnoSel) return
    setGuardando(true); setError('')
    try {
      await api.post('/pagos', { idagenda: turnoSel.idagenda, monto_pago: Number(monto), metodo_pago: metodo })
      setModal(false)
      cargar()
      cargarPendientes()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al registrar')
    } finally { setGuardando(false) }
  }

  const metodoBadge = (m: string) => {
    if (m === 'efectivo') return <Badge variant="outline" className="gap-1"><Banknote className="size-3" />Efectivo</Badge>
    if (m === 'transferencia') return <Badge variant="outline" className="gap-1"><Smartphone className="size-3" />Transferencia</Badge>
    return <Badge variant="outline" className="gap-1"><CreditCard className="size-3" />Tarjeta</Badge>
  }

  return (
    <>
      <AdminHeader
        title="Caja"
        description="Registro de cobros por servicios"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-32 text-sm" />
            <span className="text-muted-foreground text-sm">—</span>
            <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-32 text-sm" />
            <Button size="sm" variant="outline" className="gap-2" onClick={() => { setErrorRetiro(''); setFormRetiro({ idusuario_barbero: '', monto: '', descripcion: '' }); setModalRetiro(true) }}>
              <ArrowDownCircle className="size-4" /><span className="hidden sm:inline">Retiro</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => { setErrorSD(''); setFormSD({ ...FORM_SD0, hora_inicio: ahoraStr() }); setServiciosSD([]); setPickerSD(''); setModalSD(true) }}>
              <Scissors className="size-4" /><span className="hidden sm:inline">Servicio Directo</span>
            </Button>
            <Button size="sm" className="gap-2" onClick={() => { setErrorVenta(''); setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' }); setModalVenta(true) }}>
              <ShoppingBag className="size-4" /><span className="hidden sm:inline">Nueva Venta</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total del período</CardTitle>
              <DollarSign className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{fmt(resumenActivo.total)}</div>
              <p className="text-xs text-muted-foreground">{resumenActivo.cantidad} cobros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Efectivo</CardTitle>
              <Banknote className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumenActivo.efectivo)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transferencia</CardTitle>
              <Smartphone className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumenActivo.transferencia)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tarjeta</CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumenActivo.tarjeta)}</div></CardContent>
          </Card>
        </div>

        {/* Turnos sin cobrar */}
        {pendientes.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Scissors className="size-4 text-yellow-500" />
                Turnos atendidos sin cobrar ({pendientes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                    <TableHead className="hidden md:table-cell">Barbero</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendientes.map(t => (
                    <TableRow key={t.idagenda}>
                      <TableCell className="font-medium">{t.cliente?.persona?.nombre_completo ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{t.servicio?.nombre_servicio}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.barbero?.persona?.nombre_completo ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="size-3" />{fmtFecha(t.fecha)}</span>
                      </TableCell>
                      <TableCell className="font-semibold">{fmt(t.servicio?.precio ?? 0)}</TableCell>
                      <TableCell>
                        <Button size="sm" className="gap-1 h-7" onClick={() => abrirModal(t)}>
                          <Plus className="size-3" />Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        )}

        {/* Retiros pendientes por barbero */}
        {retirosPendientesPorBarbero.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowDownCircle className="size-4 text-orange-500" />
                Retiros de caja pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {retirosPendientesPorBarbero.map(({ barbero, pendiente, items }) => (
                <div key={barbero.idusuario} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{barbero.persona.nombre_completo}</span>
                    {pendiente > 0 && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500/40 font-semibold">
                        Debe {fmt(pendiente)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {items.map(r => (
                      <div key={r.idretiro} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                        <div className="flex flex-col">
                          <span className={r.estado === 'devuelto' ? 'line-through text-muted-foreground' : 'font-medium'}>
                            {fmt(parseFloat(r.monto))}
                            {r.descripcion ? <span className="ml-2 text-muted-foreground font-normal">· {r.descripcion}</span> : null}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {fmtFecha(r.fecha_retiro)}
                            {r.estado === 'devuelto' && r.fecha_devolucion ? ` · Devuelto ${fmtFecha(r.fecha_devolucion)}` : ''}
                          </span>
                        </div>
                        {r.estado === 'pendiente' ? (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-green-600 border-green-500/40 hover:bg-green-500/10"
                            disabled={cobrando === r.idretiro}
                            onClick={() => cobrarRetiro(r.idretiro)}>
                            <CheckCircle2 className="size-3" />
                            {cobrando === r.idretiro ? '...' : 'Devuelto'}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-500/30 text-xs">Devuelto</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Toggle Servicios / Productos */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-full">
          <button
            onClick={() => setTabActivo('servicios')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tabActivo === 'servicios' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Scissors className="size-4" /> Servicios
          </button>
          <button
            onClick={() => setTabActivo('productos')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tabActivo === 'productos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ShoppingBag className="size-4" /> Productos
          </button>
        </div>

        {/* Historial */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {tabActivo === 'servicios' ? 'Historial de cobros' : 'Ventas de productos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {tabActivo === 'servicios' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay cobros en este período</TableCell></TableRow>
                    ) : pagos.map(p => (
                      <TableRow key={p.idpago}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtFecha(p.fecha_pago)}</TableCell>
                        <TableCell className="font-medium">{p.agenda_turno?.cliente?.persona?.nombre_completo ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{p.agenda_turno?.servicio?.nombre_servicio ?? '—'}</TableCell>
                        <TableCell className="font-semibold text-green-500 whitespace-nowrap">{fmt(parseFloat(p.monto_pago))}</TableCell>
                        <TableCell className="hidden sm:table-cell">{metodoBadge(p.metodo_pago)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell">Cant.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay ventas en este período</TableCell></TableRow>
                    ) : ventas.map(v => (
                      <TableRow key={v.idventa}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtFecha(v.fecha_venta)}</TableCell>
                        <TableCell className="font-medium">{v.producto?.nombre_producto ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{v.cantidad}</TableCell>
                        <TableCell className="font-semibold text-green-500 whitespace-nowrap">{fmt(parseFloat(v.monto_total))}</TableCell>
                        <TableCell className="hidden sm:table-cell">{metodoBadge(v.metodo_pago)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal servicio directo */}
      <Dialog open={modalSD} onOpenChange={setModalSD}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Servicio directo</DialogTitle>
            <DialogDescription>Registrá un servicio sin turno previo y cobralo al instante.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Barbero</Label>
              <Select value={formSD.idusuario_barbero} onValueChange={v => setFormSD(p => ({ ...p, idusuario_barbero: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                <SelectContent>
                  {barberosList.map(b => (
                    <SelectItem key={b.idusuario} value={String(b.idusuario)}>{b.persona.nombre_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Servicios</Label>
              <Select value={pickerSD} onValueChange={v => {
                const s = serviciosList.find(x => x.idservicio === Number(v))
                if (s && !serviciosSD.find(x => x.idservicio === s.idservicio)) {
                  const next = [...serviciosSD, s]
                  setServiciosSD(next)
                  setFormSD(p => ({ ...p, monto: String(next.reduce((a, x) => a + x.precio, 0)) }))
                }
                setPickerSD('')
              }}>
                <SelectTrigger><SelectValue placeholder="Agregar servicio…" /></SelectTrigger>
                <SelectContent>
                  {serviciosList.filter(s => !serviciosSD.find(x => x.idservicio === s.idservicio)).map(s => (
                    <SelectItem key={s.idservicio} value={String(s.idservicio)}>
                      {s.nombre_servicio} — {fmt(s.precio)}
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
                        <span className="font-medium">{fmt(s.precio)}</span>
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
                <Label>Fecha</Label>
                <Input type="date" value={formSD.fecha} onChange={e => setFormSD(p => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={formSD.hora_inicio} onChange={e => setFormSD(p => ({ ...p, hora_inicio: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input type="number" min="0" value={formSD.monto} onChange={e => setFormSD(p => ({ ...p, monto: e.target.value }))} />
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
            </div>
            {errorSD && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorSD}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalSD(false)}>Cancelar</Button>
            <Button onClick={registrarServicioDirecto}
              disabled={guardandoSD || !formSD.idusuario_barbero || serviciosSD.length === 0 || !formSD.hora_inicio || !formSD.monto}>
              {guardandoSD ? 'Registrando...' : 'Registrar y cobrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal retiro de caja */}
      <Dialog open={modalRetiro} onOpenChange={setModalRetiro}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar retiro de caja</DialogTitle>
            <DialogDescription>El barbero retira dinero en efectivo de la caja.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Barbero</Label>
              <Select value={formRetiro.idusuario_barbero} onValueChange={v => setFormRetiro(p => ({ ...p, idusuario_barbero: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                <SelectContent>
                  {barberosList.map(b => (
                    <SelectItem key={b.idusuario} value={String(b.idusuario)}>{b.persona.nombre_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monto retirado</Label>
              <Input type="number" min="0" placeholder="0" value={formRetiro.monto}
                onChange={e => setFormRetiro(p => ({ ...p, monto: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input placeholder="Ej: adelanto de comisión" value={formRetiro.descripcion}
                onChange={e => setFormRetiro(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            {errorRetiro && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorRetiro}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalRetiro(false)}>Cancelar</Button>
            <Button onClick={registrarRetiro}
              disabled={guardandoRetiro || !formRetiro.idusuario_barbero || !formRetiro.monto}>
              {guardandoRetiro ? 'Guardando...' : 'Registrar retiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal nueva venta */}
      <Dialog open={modalVenta} onOpenChange={setModalVenta}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar venta de producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select value={formVenta.idproducto} onValueChange={v => setFormVenta(p => ({ ...p, idproducto: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {productos.filter(p => p.stock_actual > 0).map(p => (
                    <SelectItem key={p.idproducto} value={String(p.idproducto)}>
                      {p.nombre_producto} — {fmt(p.precio_venta)} (stock: {p.stock_actual})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input type="number" min="1" max={productoSel?.stock_actual ?? 99} value={formVenta.cantidad}
                onChange={e => setFormVenta(p => ({ ...p, cantidad: e.target.value }))} />
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
            {productoSel && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 flex justify-between items-center">
                <span className="text-sm">Total</span>
                <span className="font-bold text-primary">{fmt(productoSel.precio_venta * Number(formVenta.cantidad))}</span>
              </div>
            )}
            {errorVenta && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorVenta}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalVenta(false)}>Cancelar</Button>
            <Button onClick={registrarVenta} disabled={guardandoVenta || !formVenta.idproducto}>
              {guardandoVenta ? 'Guardando...' : 'Confirmar venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal registrar cobro */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar cobro</DialogTitle>
            <DialogDescription>
              {turnoSel?.cliente?.persona?.nombre_completo ?? ''} · {turnoSel?.servicio?.nombre_servicio ?? ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo"><span className="flex items-center gap-2"><Banknote className="size-4" />Efectivo</span></SelectItem>
                  <SelectItem value="transferencia"><span className="flex items-center gap-2"><Smartphone className="size-4" />Transferencia</span></SelectItem>
                  <SelectItem value="tarjeta"><span className="flex items-center gap-2"><CreditCard className="size-4" />Tarjeta</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={registrarPago} disabled={guardando || !monto}>
              {guardando ? 'Guardando...' : 'Confirmar cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
