'use client'

import { useState, useMemo } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Search, 
  DollarSign,
  CreditCard,
  Banknote,
  TrendingUp,
  ShoppingBag,
  Scissors,
  Check
} from 'lucide-react'
import { ventas, turnos, productos, servicios, clientes, barberos } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function PagosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'servicios' | 'productos'>('servicios')
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)

  // Estado para el nuevo formulario de pago
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')
  const [selectedServicios, setSelectedServicios] = useState<string[]>([])
  const [metodoPago, setMetodoPago] = useState<string>('efectivo')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calcular subtotales de servicios seleccionados
  const serviciosSeleccionados = useMemo(() => {
    return servicios.filter(s => selectedServicios.includes(s.id))
  }, [selectedServicios])

  const subtotalGeneral = useMemo(() => {
    return serviciosSeleccionados.reduce((acc, s) => acc + s.precio, 0)
  }, [serviciosSeleccionados])

  // Toggle servicio seleccionado
  const toggleServicio = (servicioId: string) => {
    setSelectedServicios(prev => 
      prev.includes(servicioId) 
        ? prev.filter(id => id !== servicioId)
        : [...prev, servicioId]
    )
  }

  // Resetear formulario
  const resetPaymentForm = () => {
    setSelectedClienteId('')
    setSelectedServicios([])
    setMetodoPago('efectivo')
  }

  // Calculate stats
  const completedAppointments = turnos.filter(t => t.estado === 'finalizado')
  const totalServiceIncome = completedAppointments.reduce((acc, t) => acc + t.precioFinal, 0)
  const totalProductSales = ventas.reduce((acc, v) => acc + v.total, 0)
  const totalIncome = totalServiceIncome + totalProductSales

  const cashPayments = ventas.filter(v => v.metodoPago === 'efectivo')
    .reduce((acc, v) => acc + v.total, 0)
  const transferPayments = ventas.filter(v => v.metodoPago === 'transferencia')
    .reduce((acc, v) => acc + v.total, 0)

  return (
    <>
      <AdminHeader 
        title="Pagos y Ventas" 
        description="Registro de ingresos por servicios y productos"
        actions={
          <div className="flex gap-2">
            <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
              setIsPaymentDialogOpen(open)
              if (!open) resetPaymentForm()
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CreditCard className="size-4" />
                  <span className="hidden sm:inline">Registrar Pago</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Pago de Servicio</DialogTitle>
                  <DialogDescription>
                    Selecciona el cliente y los servicios realizados
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* 1. Cliente */}
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar o seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* 2. Servicios */}
                  <div className="grid gap-2">
                    <Label>Servicios realizados</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                      {servicios.filter(s => s.activo).map(servicio => (
                        <div 
                          key={servicio.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer",
                            selectedServicios.includes(servicio.id) 
                              ? "bg-primary/10 border border-primary/30" 
                              : "hover:bg-muted"
                          )}
                          onClick={() => toggleServicio(servicio.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={selectedServicios.includes(servicio.id)}
                              onCheckedChange={() => toggleServicio(servicio.id)}
                            />
                            <span className="text-sm font-medium">{servicio.nombre}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(servicio.precio)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Subtotal por servicio */}
                  {serviciosSeleccionados.length > 0 && (
                    <>
                      <Separator />
                      <div className="grid gap-2">
                        <Label>Detalle de servicios</Label>
                        <div className="space-y-1 rounded-lg bg-muted p-3">
                          {serviciosSeleccionados.map(s => (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <span>{s.nombre}</span>
                              <span className="font-mono">{formatCurrency(s.precio)}</span>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between font-medium">
                            <span>Subtotal</span>
                            <span className="font-mono">{formatCurrency(subtotalGeneral)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* 4. Metodo de pago */}
                  <div className="grid gap-2">
                    <Label>Metodo de pago</Label>
                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">
                          <div className="flex items-center gap-2">
                            <Banknote className="size-4" />
                            Efectivo
                          </div>
                        </SelectItem>
                        <SelectItem value="transferencia">
                          <div className="flex items-center gap-2">
                            <CreditCard className="size-4" />
                            Transferencia
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 5. Total destacado */}
                  {serviciosSeleccionados.length > 0 && (
                    <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Total a cobrar</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(subtotalGeneral)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsPaymentDialogOpen(false)
                    resetPaymentForm()
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsPaymentDialogOpen(false)
                      resetPaymentForm()
                    }}
                    disabled={!selectedClienteId || serviciosSeleccionados.length === 0}
                  >
                    <Check className="mr-2 size-4" />
                    Registrar Pago
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Nueva Venta</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Venta de Producto</DialogTitle>
                  <DialogDescription>
                    Registra la venta de productos
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Producto</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.filter(p => p.stock > 0).map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre} - {formatCurrency(p.precio)} ({p.stock} disp.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cantidad</Label>
                    <Input type="number" defaultValue={1} min={1} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cliente (opcional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Metodo de pago</Label>
                    <Select defaultValue="efectivo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsSaleDialogOpen(false)}>
                    Registrar Venta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">este periodo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por Servicios
              </CardTitle>
              <Scissors className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalServiceIncome)}</div>
              <p className="text-xs text-muted-foreground">{completedAppointments.length} turnos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por Productos
              </CardTitle>
              <ShoppingBag className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalProductSales)}</div>
              <p className="text-xs text-muted-foreground">{ventas.length} ventas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metodos de Pago
              </CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Banknote className="size-4 text-success" />
                  {formatCurrency(cashPayments)}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="size-4 text-info" />
                  {formatCurrency(transferPayments)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Sales Types */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="servicios" className="gap-2">
              <Scissors className="size-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="productos" className="gap-2">
              <ShoppingBag className="size-4" />
              Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servicios" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pagos por Servicios</CardTitle>
                <CardDescription>Historial de pagos por turnos completados</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Servicio</TableHead>
                      <TableHead className="hidden sm:table-cell">Barbero</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="hidden sm:table-cell">Metodo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAppointments.map(apt => (
                      <TableRow key={apt.id}>
                        <TableCell>{formatDate(apt.fecha)}</TableCell>
                        <TableCell className="font-medium">{apt.cliente.nombre}</TableCell>
                        <TableCell className="hidden md:table-cell">{apt.servicio.nombre}</TableCell>
                        <TableCell className="hidden sm:table-cell">{apt.barbero.nombre}</TableCell>
                        <TableCell className="font-semibold text-success">
                          {formatCurrency(apt.precioFinal)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            <Banknote className="mr-1 size-3" />
                            Efectivo
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ventas de Productos</CardTitle>
                <CardDescription>Historial de ventas de productos</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="hidden sm:table-cell">Metodo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map(venta => (
                      <TableRow key={venta.id}>
                        <TableCell>{formatDate(venta.fecha)}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {venta.productos.map((item, i) => (
                              <p key={i} className="truncate text-sm">
                                {item.cantidad}x {item.producto.nombre}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {venta.clienteId 
                            ? clientes.find(c => c.id === venta.clienteId)?.nombre 
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-semibold text-success">
                          {formatCurrency(venta.total)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">
                            {venta.metodoPago === 'efectivo' ? (
                              <><Banknote className="mr-1 size-3" /> Efectivo</>
                            ) : (
                              <><CreditCard className="mr-1 size-3" /> Transferencia</>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
