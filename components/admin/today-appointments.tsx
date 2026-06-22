'use client'

import { Clock, MoreHorizontal, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Appointment, AppointmentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pendiente:  { label: 'Pendiente',  variant: 'secondary',    icon: Clock },
  reservado:  { label: 'Reservado',  variant: 'secondary',    icon: Clock },
  confirmado: { label: 'Confirmado', variant: 'default',      icon: CheckCircle },
  finalizado: { label: 'Finalizado', variant: 'outline',      icon: CheckCircle },
  cancelado:  { label: 'Cancelado',  variant: 'destructive',  icon: XCircle },
  ausente:    { label: 'Ausente',    variant: 'destructive',  icon: AlertCircle },
}

const defaultStatus = { label: 'Pendiente', variant: 'secondary' as const, icon: Clock }

interface TodayAppointmentsProps {
  appointments: Appointment[]
  onStatusChange?: (id: string, status: AppointmentStatus) => void
}

export function TodayAppointments({ appointments, onStatusChange }: TodayAppointmentsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sortedAppointments = [...appointments].sort((a, b) => 
    a.horaInicio.localeCompare(b.horaInicio)
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Turnos de Hoy</CardTitle>
          <CardDescription>{appointments.length} turnos programados</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/agenda">Ver agenda completa</a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sortedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay turnos programados para hoy</p>
            </div>
          ) : (
            sortedAppointments.map((appointment) => {
              const status = statusConfig[appointment.estado] ?? defaultStatus
              const StatusIcon = status.icon
              return (
                <div
                  key={appointment.id}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50',
                    appointment.estado === 'finalizado' && 'opacity-60'
                  )}
                >
                  <div className="flex w-16 flex-col items-center">
                    <span className="text-lg font-semibold text-foreground">
                      {appointment.horaInicio}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {appointment.horaFin}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(appointment.cliente.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {appointment.cliente.nombre}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {appointment.servicio.nombre} - {appointment.barbero.nombre}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={status.variant}
                    className="hidden sm:flex items-center gap-1"
                  >
                    <StatusIcon className="size-3" />
                    {status.label}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, 'confirmado')}>
                        <CheckCircle className="mr-2 size-4" />
                        Confirmar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, 'finalizado')}>
                        <CheckCircle className="mr-2 size-4" />
                        Finalizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange?.(appointment.id, 'ausente')}
                        className="text-destructive"
                      >
                        <AlertCircle className="mr-2 size-4" />
                        Marcar ausente
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange?.(appointment.id, 'cancelado')}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 size-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
