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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, CreditCard, Banknote, Smartphone, Plus, Scissors, Calendar, ShoppingBag } from 'lucide-react'
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

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
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

  // Ventas de productos
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [modalVenta, setModalVenta] = useState(false)
  const [formVenta, setFormVenta] = useState({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' })
  const [guardandoVenta, setGuardandoVenta] = useState(false)
  const [errorVenta, setErrorVenta] = useState('')

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
  useEffect(() => { cargarPendientes(); cargarProductos() }, [])

  const registrarVenta = async () => {
    setGuardandoVenta(true); setErrorVenta('')
    try {
      await api.post('/ventas', { idproducto: Number(formVenta.idproducto), cantidad: Number(formVenta.cantidad), metodo_pago: formVenta.metodo_pago })
      setModalVenta(false); setFormVenta({ idproducto: '', cantidad: '1', metodo_pago: 'efectivo' }); cargar(); cargarProductos()
    } catch (e: unknown) { setErrorVenta(e instanceof Error ? e.message : 'Error') }
    finally { setGuardandoVenta(false) }
  }

  const productoSel = productos.find(p => p.idproducto === Number(formVenta.idproducto))

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
              <div className="text-2xl font-bold text-primary">{fmt(resumen.total)}</div>
              <p className="text-xs text-muted-foreground">{resumen.cantidad} cobros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Efectivo</CardTitle>
              <Banknote className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumen.efectivo)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transferencia</CardTitle>
              <Smartphone className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumen.transferencia)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tarjeta</CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(resumen.tarjeta)}</div></CardContent>
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

        {/* Tabs servicios / productos */}
        <Tabs defaultValue="servicios">
          <TabsList>
            <TabsTrigger value="servicios" className="gap-2"><Scissors className="size-4" />Servicios</TabsTrigger>
            <TabsTrigger value="productos" className="gap-2"><ShoppingBag className="size-4" />Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="servicios" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Historial de cobros</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Servicio</TableHead>
                      <TableHead className="hidden sm:table-cell">Barbero</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay cobros en este período</TableCell></TableRow>
                    ) : pagos.map(p => (
                      <TableRow key={p.idpago}>
                        <TableCell className="text-sm text-muted-foreground">{fmtFecha(p.fecha_pago)}</TableCell>
                        <TableCell className="font-medium">{p.agenda_turno?.cliente?.persona?.nombre_completo ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">{p.agenda_turno?.servicio?.nombre_servicio ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{p.agenda_turno?.barbero?.persona?.nombre_completo ?? '—'}</TableCell>
                        <TableCell className="font-semibold text-green-500">{fmt(parseFloat(p.monto_pago))}</TableCell>
                        <TableCell className="hidden sm:table-cell">{metodoBadge(p.metodo_pago)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Ventas de productos</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="hidden sm:table-cell">Cantidad</TableHead>
                      <TableHead className="hidden sm:table-cell">Barbero</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="hidden sm:table-cell">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No hay ventas en este período</TableCell></TableRow>
                    ) : ventas.map(v => (
                      <TableRow key={v.idventa}>
                        <TableCell className="text-sm text-muted-foreground">{fmtFecha(v.fecha_venta)}</TableCell>
                        <TableCell className="font-medium">{v.producto?.nombre_producto ?? '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{v.cantidad}</TableCell>
                        <TableCell className="hidden sm:table-cell">{v.barbero?.persona?.nombre_completo ?? '—'}</TableCell>
                        <TableCell className="font-semibold text-green-500">{fmt(parseFloat(v.monto_total))}</TableCell>
                        <TableCell className="hidden sm:table-cell">{metodoBadge(v.metodo_pago)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
