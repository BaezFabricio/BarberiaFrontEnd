'use client'

import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Package
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'warning' | 'success'
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  variant = 'default'
}: MetricCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden',
      variant === 'warning' && 'border-warning/50',
      variant === 'success' && 'border-success/50'
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'rounded-lg p-2',
          variant === 'default' && 'bg-primary/10',
          variant === 'warning' && 'bg-warning/10',
          variant === 'success' && 'bg-success/10'
        )}>
          <Icon className={cn(
            'size-4',
            variant === 'default' && 'text-primary',
            variant === 'warning' && 'text-warning',
            variant === 'success' && 'text-success'
          )} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span className={cn(
                'flex items-center text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="mr-1 size-3" />
                ) : (
                  <TrendingDown className="mr-1 size-3" />
                )}
                {trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardMetricsProps {
  ingresosDiarios: number
  periodo: 'hoy' | 'semana' | 'mes'
  turnosHoy: number
  turnosConfirmados: number
  turnosPendientes: number
  clientesActivos: number
  clientesInactivos: number
  productosStockBajo: number
}

const PERIODO_LABEL = { hoy: 'hoy', semana: 'esta semana', mes: 'este mes' }

export function DashboardMetrics({
  ingresosDiarios, periodo, turnosHoy, turnosConfirmados, turnosPendientes, clientesActivos, clientesInactivos, productosStockBajo
}: DashboardMetricsProps) {
  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Ingresos"
        value={fmt(ingresosDiarios)}
        description={`cobrado ${PERIODO_LABEL[periodo]}`}
        icon={DollarSign}
        variant="success"
      />
      <MetricCard
        title="Turnos hoy"
        value={turnosHoy}
        description={`${turnosConfirmados} confirmados · ${turnosPendientes} pendientes`}
        icon={Calendar}
      />
      <MetricCard
        title="Clientes totales"
        value={clientesActivos}
        description={clientesInactivos > 0 ? `${clientesInactivos} inactivos` : 'todos activos'}
        icon={Users}
        variant={clientesInactivos > 0 ? 'warning' : 'default'}
      />
      <MetricCard
        title="Stock bajo"
        value={productosStockBajo}
        description="productos a reponer"
        icon={Package}
        variant={productosStockBajo > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
