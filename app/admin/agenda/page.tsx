'use client'

import { useState, useMemo } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { turnos, barberos, servicios, clientes, horariosDisponibles } from '@/lib/mock-data'
import { Appointment, AppointmentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
  reservado: { label: 'Reservado', color: 'text-blue-400', bgColor: 'bg-blue-400/10 border-blue-400/20' },
  confirmado: { label: 'Confirmado', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20' },
  finalizado: { label: 'Finalizado', color: 'text-muted-foreground', bgColor: 'bg-muted border-muted' },
  cancelado: { label: 'Cancelado', color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20' },
  ausente: { label: 'Ausente', color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20' },
}

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const fullDaysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDateString = (date: Date) => date.toISOString().split('T')[0]

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    
    // Next month days to fill grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    
    return days
  }, [currentDate])

  // Get week days
  const weekDays = useMemo(() => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }, [selectedDate])

  // Filter appointments
  const filteredAppointments = turnos.filter(apt => {
    if (selectedBarberId !== 'all' && apt.barberoId !== selectedBarberId) return false
    return true
  })

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateString(date)
    return filteredAppointments.filter(apt => apt.fecha === dateStr)
  }

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setSelectedDate(newDate)
  }

  const navigateDay = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + direction)
    setSelectedDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const activeBarbers = barberos.filter(b => b.activo)

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
                <DialogDescription>
                  Agenda un nuevo turno para un cliente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
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
                  <Label>Servicio</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.filter(s => s.activo).map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre} - ${s.precio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Barbero</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBarbers.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hora</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Horario" />
                      </SelectTrigger>
                      <SelectContent>
                        {horariosDisponibles.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo de turno</Label>
                  <Select defaultValue="reserva_previa">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reserva_previa">Reserva previa</SelectItem>
                      <SelectItem value="orden_llegada">Orden de llegada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
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
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los barberos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los barberos</SelectItem>
                {activeBarbers.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              setCurrentDate(new Date())
              setSelectedDate(new Date())
            }}>
              Hoy
            </Button>
          </div>
        </div>

        {/* Day View */}
        {viewMode === 'day' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)}>
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
                <Button variant="ghost" size="icon" onClick={() => navigateDay(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Badge variant="outline">
                {getAppointmentsForDate(selectedDate).length} turnos
              </Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {horariosDisponibles.map(hora => {
                    const appointments = getAppointmentsForDate(selectedDate)
                      .filter(apt => apt.horaInicio === hora)
                    
                    return (
                      <div key={hora} className="flex gap-4 border-b border-border/50 pb-2">
                        <div className="w-16 shrink-0 pt-2 text-sm text-muted-foreground">
                          {hora}
                        </div>
                        <div className="flex-1 min-h-[60px]">
                          {appointments.length > 0 ? (
                            <div className="space-y-2">
                              {appointments.map(apt => {
                                const status = statusConfig[apt.estado]
                                return (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      'rounded-lg border p-3 transition-colors hover:bg-muted/50',
                                      status.bgColor
                                    )}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="size-8">
                                          <AvatarFallback className="text-xs">
                                            {getInitials(apt.cliente.nombre)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm">{apt.cliente.nombre}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {apt.servicio.nombre} con {apt.barbero.nombre}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className={status.color}>
                                        {status.label}
                                      </Badge>
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

        {/* Week View */}
        {viewMode === 'week' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <CardTitle className="text-lg">
                  {weekDays[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      'min-h-[200px] rounded-lg border p-2',
                      isToday(day) && 'border-primary',
                      isSelected(day) && 'bg-muted/50'
                    )}
                  >
                    <div className="mb-2 text-center">
                      <p className="text-xs text-muted-foreground">{daysOfWeek[i]}</p>
                      <p className={cn(
                        'text-sm font-medium',
                        isToday(day) && 'text-primary'
                      )}>
                        {day.getDate()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {getAppointmentsForDate(day).slice(0, 3).map(apt => {
                        const status = statusConfig[apt.estado]
                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              'rounded p-1 text-xs',
                              status.bgColor
                            )}
                          >
                            <p className="truncate font-medium">{apt.horaInicio}</p>
                            <p className="truncate text-muted-foreground">{apt.cliente.nombre}</p>
                          </div>
                        )
                      })}
                      {getAppointmentsForDate(day).length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{getAppointmentsForDate(day).length - 3} mas
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <CardTitle className="text-lg capitalize">
                  {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {calendarDays.map(({ date, isCurrentMonth }, i) => {
                  const dayAppointments = getAppointmentsForDate(date)
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(date)
                        setViewMode('day')
                      }}
                      className={cn(
                        'min-h-[80px] rounded-lg border p-2 text-left transition-colors hover:bg-muted/50',
                        !isCurrentMonth && 'opacity-40',
                        isToday(date) && 'border-primary',
                        isSelected(date) && 'bg-primary/10'
                      )}
                    >
                      <p className={cn(
                        'text-sm',
                        isToday(date) && 'font-bold text-primary'
                      )}>
                        {date.getDate()}
                      </p>
                      {dayAppointments.length > 0 && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {dayAppointments.length} turno{dayAppointments.length > 1 ? 's' : ''}
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
    </>
  )
}
