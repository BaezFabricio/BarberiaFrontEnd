'use client'

import { useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Star,
  UserPlus,
  UserX,
  Download,
  BarChart3,
  PieChart,
  Scissors
} from 'lucide-react'
import { 
  turnos, 
  barberos, 
  clientes, 
  gastos, 
  ventas, 
  estadisticasNegocio 
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Calculate financial stats
  const totalServiceIncome = turnos
    .filter(t => t.estado === 'finalizado')
    .reduce((acc, t) => acc + t.precioFinal, 0)
  const totalProductSales = ventas.reduce((acc, v) => acc + v.total, 0)
  const totalIncome = totalServiceIncome + totalProductSales
  const totalExpenses = gastos.reduce((acc, g) => acc + g.monto, 0)
  const netProfit = totalIncome - totalExpenses

  // Barber stats
  const barberStats = barberos.filter(b => b.activo).map(barber => {
    const barberTurnos = turnos.filter(t => t.barberoId === barber.id && t.estado === 'finalizado')
    const income = barberTurnos.reduce((acc, t) => acc + t.precioFinal, 0)
    return {
      ...barber,
      turnos: barberTurnos.length,
      income,
      commission: income * (barber.comision / 100)
    }
  }).sort((a, b) => b.income - a.income)

  // Client stats
  const frequentClients = clientes.filter(c => c.esClienteFrecuente)
  const newClients = clientes.filter(c => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(c.fechaRegistro) >= thirtyDaysAgo
  })
  const inactiveClients = clientes.filter(c => {
    if (!c.ultimaVisita) return true
    const lastVisit = new Date(c.ultimaVisita)
    const daysSinceVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceVisit >= 60
  })

  // Appointment stats
  const completedTurnos = turnos.filter(t => t.estado === 'finalizado').length
  const cancelledTurnos = turnos.filter(t => t.estado === 'cancelado').length
  const noShowTurnos = turnos.filter(t => t.estado === 'ausente').length
  const totalTurnos = turnos.length
  const completionRate = (completedTurnos / totalTurnos) * 100

  const maxBarberIncome = Math.max(...barberStats.map(b => b.income))

  return (
    <>
      <AdminHeader 
        title="Reportes" 
        description="Estadisticas y analisis del negocio"
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumen del Periodo</h2>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
              <TrendingUp className="size-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Servicios: {formatCurrency(totalServiceIncome)}</span>
                <span>|</span>
                <span>Productos: {formatCurrency(totalProductSales)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gastos Totales
              </CardTitle>
              <TrendingDown className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancia Neta
              </CardTitle>
              <DollarSign className={cn('size-4', netProfit >= 0 ? 'text-success' : 'text-destructive')} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', netProfit >= 0 ? 'text-success' : 'text-destructive')}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margen: {((netProfit / totalIncome) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Completado
              </CardTitle>
              <Calendar className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <Progress value={completionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="barberos">
          <TabsList>
            <TabsTrigger value="barberos" className="gap-2">
              <Scissors className="size-4" />
              Barberos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2">
              <Users className="size-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="turnos" className="gap-2">
              <Calendar className="size-4" />
              Turnos
            </TabsTrigger>
          </TabsList>

          {/* Barber Performance */}
          <TabsContent value="barberos" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento por Barbero</CardTitle>
                <CardDescription>Ingresos y estadisticas individuales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {barberStats.map(barber => {
                  const percentage = (barber.income / maxBarberIncome) * 100
                  return (
                    <div key={barber.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(barber.nombre)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{barber.nombre}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{barber.turnos} turnos</span>
                              <span className="flex items-center gap-1">
                                <Star className="size-3 fill-primary text-primary" />
                                {barber.estadisticas.calificacionPromedio}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success">{formatCurrency(barber.income)}</p>
                          <p className="text-xs text-muted-foreground">
                            Comision: {formatCurrency(barber.commission)} ({barber.comision}%)
                          </p>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Stats */}
          <TabsContent value="clientes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clientes Frecuentes
                  </CardTitle>
                  <Star className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{frequentClients.length}</div>
                  <p className="text-xs text-muted-foreground">10+ turnos</p>
                  <div className="mt-4 space-y-2">
                    {frequentClients.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center justify-between text-sm">
                        <span>{client.nombre}</span>
                        <Badge variant="secondary">{client.turnosTotales} turnos</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clientes Nuevos
                  </CardTitle>
                  <UserPlus className="size-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{newClients.length}</div>
                  <p className="text-xs text-muted-foreground">ultimos 30 dias</p>
                  <div className="mt-4 space-y-2">
                    {newClients.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center justify-between text-sm">
                        <span>{client.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(client.fechaRegistro).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clientes Inactivos
                  </CardTitle>
                  <UserX className="size-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inactiveClients.length}</div>
                  <p className="text-xs text-muted-foreground">60+ dias sin visita</p>
                  <div className="mt-4 space-y-2">
                    {inactiveClients.slice(0, 3).map(client => (
                      <div key={client.id} className="flex items-center justify-between text-sm">
                        <span>{client.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.ultimaVisita 
                            ? new Date(client.ultimaVisita).toLocaleDateString('es-AR')
                            : 'Nunca'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointment Stats */}
          <TabsContent value="turnos" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadisticas de Turnos</CardTitle>
                  <CardDescription>Resumen del periodo seleccionado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de turnos</span>
                    <span className="font-semibold">{totalTurnos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completados</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{completedTurnos}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({((completedTurnos / totalTurnos) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cancelados</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{cancelledTurnos}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({((cancelledTurnos / totalTurnos) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ausentes</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-warning border-warning">{noShowTurnos}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ({((noShowTurnos / totalTurnos) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ingresos por Tipo</CardTitle>
                  <CardDescription>Distribucion de ingresos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-primary" />
                        Servicios
                      </span>
                      <span className="font-semibold">{formatCurrency(totalServiceIncome)}</span>
                    </div>
                    <Progress 
                      value={(totalServiceIncome / totalIncome) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-chart-2" />
                        Productos
                      </span>
                      <span className="font-semibold">{formatCurrency(totalProductSales)}</span>
                    </div>
                    <Progress 
                      value={(totalProductSales / totalIncome) * 100} 
                      className="h-2 [&>div]:bg-chart-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
