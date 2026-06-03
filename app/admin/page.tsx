'use client'

import { AdminHeader } from '@/components/admin/admin-layout'
import { DashboardMetrics } from '@/components/admin/dashboard-metrics'
import { TodayAppointments } from '@/components/admin/today-appointments'
import { BarberPerformance } from '@/components/admin/barber-performance'
import { LowStockAlert } from '@/components/admin/low-stock-alert'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { estadisticasNegocio, turnos, barberos, productos } from '@/lib/mock-data'

export default function AdminDashboard() {
  const hoy = new Date().toISOString().split('T')[0]
  const turnosHoy = turnos.filter(t => t.fecha === hoy)

  return (
    <>
      <AdminHeader 
        title="Dashboard" 
        description="Resumen general del negocio"
        actions={
          <Button className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo Turno</span>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <DashboardMetrics
          ingresosDiarios={estadisticasNegocio.ingresosDiarios}
          turnosHoy={estadisticasNegocio.turnosHoy}
          clientesActivos={estadisticasNegocio.clientesActivos}
          productosStockBajo={estadisticasNegocio.productosStockBajo}
        />
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodayAppointments appointments={turnosHoy} />
          </div>
          <div className="space-y-6">
            <BarberPerformance barbers={barberos} />
            <LowStockAlert products={productos} />
          </div>
        </div>
      </div>
    </>
  )
}
