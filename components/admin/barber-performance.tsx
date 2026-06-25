'use client'

import { Scissors, Star, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Barber } from '@/lib/types'

interface BarberPerformanceProps {
  barbers: Barber[]
}

export function BarberPerformance({ barbers }: BarberPerformanceProps) {
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

  const activeBarbers = barbers.filter(b => b.activo)
  const maxIncome = Math.max(...activeBarbers.map(b => b.estadisticas.ingresosMes))

  return (
    <Card className="overflow-hidden min-w-0">
      <CardHeader>
        <CardTitle className="text-lg">Rendimiento de Barberos</CardTitle>
        <CardDescription>Estadisticas del mes actual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeBarbers.map((barber) => {
          const progressPercentage = (barber.estadisticas.ingresosMes / maxIncome) * 100
          return (
            <div key={barber.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(barber.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium text-foreground">
                      {barber.nombre}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground ml-2">
                      <Star className="size-3 fill-primary text-primary" />
                      <span>{barber.estadisticas.calificacionPromedio}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {barber.estadisticas.turnosMes} turnos
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {formatCurrency(barber.estadisticas.ingresosMes)}
                    </span>
                  </div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
