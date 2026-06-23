'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Pencil, 
  Star,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Phone,
  Mail,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { barberos, turnos } from '@/lib/mock-data'

export default function BarberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const barber = barberos.find(b => b.id === id)
  
  if (!barber) {
    return (
      <>
        <AdminHeader 
          title="Barbero no encontrado" 
          description="El barbero solicitado no existe"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 size-4" />
              Volver
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6">
              <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Barbero no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No pudimos encontrar el barbero que buscas.
              </p>
              <Button asChild>
                <Link href="/admin/barberos">Ver todos los barberos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const barberAppointments = turnos.filter(t => t.barberoId === id)
  const todayAppointments = barberAppointments.filter(t => {
    const today = new Date().toISOString().split('T')[0]
    return t.fecha === today
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalizado':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Finalizado</Badge>
      case 'confirmado':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Confirmado</Badge>
      case 'reservado':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Reservado</Badge>
      case 'cancelado':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelado</Badge>
      case 'ausente':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Ausente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const
  const diasLabels: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miercoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sabado',
    domingo: 'Domingo'
  }

  return (
    <>
      <AdminHeader 
        title={barber.nombre}
        description="Perfil y estadisticas del barbero"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 size-4" />
              Volver
            </Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Pencil className="mr-2 size-4" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Barbero</DialogTitle>
                  <DialogDescription>
                    Modifica los datos del barbero
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-nombre">Nombre completo</Label>
                    <Input id="edit-nombre" defaultValue={barber.nombre} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Correo electronico</Label>
                    <Input id="edit-email" type="email" defaultValue={barber.email} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-telefono">Telefono</Label>
                    <Input id="edit-telefono" defaultValue={barber.telefono} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-comision">Comision (%)</Label>
                    <Input id="edit-comision" type="number" defaultValue={barber.comision} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-activo">Estado activo</Label>
                    <Switch id="edit-activo" defaultChecked={barber.activo} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsEditDialogOpen(false)}>
                    Guardar cambios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="size-20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(barber.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{barber.nombre}</h2>
                  <Badge variant={barber.activo ? 'default' : 'secondary'}>
                    {barber.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="size-4" />
                    {barber.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="size-4" />
                    {barber.telefono}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {barber.especialidades.map((esp) => (
                    <Badge key={esp} variant="outline" className="text-xs">
                      {esp}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-lg">
                <Star className="size-5 fill-primary text-primary" />
                <span className="font-semibold">{barber.estadisticas.calificacionPromedio}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Turnos del Mes
              </CardTitle>
              <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barber.estadisticas.turnosMes}</div>
              <p className="text-xs text-muted-foreground">clientes atendidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos del Mes
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(barber.estadisticas.ingresosMes)}</div>
              <p className="text-xs text-muted-foreground">generados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Totales
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barber.estadisticas.clientesAtendidos}</div>
              <p className="text-xs text-muted-foreground">desde el inicio</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comision
              </CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{barber.comision}%</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(barber.estadisticas.ingresosMes * (barber.comision / 100))} este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agenda" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="horarios">Horarios</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Turnos de Hoy</CardTitle>
                <CardDescription>
                  {todayAppointments.length} turnos programados para hoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No hay turnos programados para hoy</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                        <TableHead className="hidden sm:table-cell">Precio</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayAppointments.map((turno) => (
                        <TableRow key={turno.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-muted-foreground" />
                              {turno.horaInicio}
                            </div>
                          </TableCell>
                          <TableCell>{turno.cliente.nombre}</TableCell>
                          <TableCell className="hidden sm:table-cell">{turno.servicio.nombre}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatCurrency(turno.precioFinal)}</TableCell>
                          <TableCell>{getStatusBadge(turno.estado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Horario de Trabajo</CardTitle>
                <CardDescription>
                  Horarios configurados para este barbero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {diasSemana.map((dia) => {
                    const horario = barber.horarioTrabajo[dia]
                    return (
                      <div key={dia} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{diasLabels[dia]}</span>
                        {horario ? (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="size-4 text-green-500" />
                            <span>{horario.inicio} - {horario.fin}</span>
                            {horario.descanso && (
                              <span className="text-muted-foreground">
                                (Descanso: {horario.descanso.inicio} - {horario.descanso.fin})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <XCircle className="size-4" />
                            <span>No trabaja</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Turnos</CardTitle>
                <CardDescription>
                  Ultimos turnos atendidos por este barbero
                </CardDescription>
              </CardHeader>
              <CardContent>
                {barberAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No hay turnos en el historial</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">Servicio</TableHead>
                        <TableHead className="hidden sm:table-cell">Precio</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {barberAppointments.slice(0, 10).map((turno) => (
                        <TableRow key={turno.id}>
                          <TableCell>{new Date(turno.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>{turno.horaInicio}</TableCell>
                          <TableCell>{turno.cliente.nombre}</TableCell>
                          <TableCell className="hidden sm:table-cell">{turno.servicio.nombre}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatCurrency(turno.precioFinal)}</TableCell>
                          <TableCell>{getStatusBadge(turno.estado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
