'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { DashboardMetrics } from '@/components/admin/dashboard-metrics'
import { TodayAppointments } from '@/components/admin/today-appointments'
import { BarberPerformance } from '@/components/admin/barber-performance'
import { LowStockAlert } from '@/components/admin/low-stock-alert'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'

type Turno = {
  idagenda: number
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  servicio: { nombre_servicio: string; precio: number; duracion_minutos: number }
  cliente?: { persona: { nombre_completo: string; telefono: string } }
  barbero: { idusuario: number; persona: { nombre_completo: string } }
}

type Barbero = {
  idusuario: number
  rating_promedio: number
  comision_porcentaje: number
  persona: { nombre_completo: string }
}

type Producto = {
  idproducto: number
  nombre_producto: string
  stock_actual: number
  stock_minimo: number
  precio_venta: number
  categoria: string
}

type Cliente = { idcliente: number }

export default function AdminDashboard() {
  const hoy = new Date().toISOString().split('T')[0]

  const [turnosHoy, setTurnosHoy] = useState<Turno[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [totalClientes, setTotalClientes] = useState(0)

  useEffect(() => {
    Promise.allSettled([
      api.get<Turno[]>(`/turnos?fecha=${hoy}`),
      api.get<Barbero[]>('/barberos'),
      api.get<Producto[]>('/productos'),
      api.get<Cliente[]>('/clientes'),
    ]).then(([turnos, barbs, prods, clts]) => {
      if (turnos.status === 'fulfilled') setTurnosHoy(turnos.value)
      if (barbs.status === 'fulfilled') setBarberos(barbs.value)
      if (prods.status === 'fulfilled') setProductos(prods.value)
      if (clts.status === 'fulfilled') setTotalClientes(clts.value.length)
    })
  }, [hoy])

  // Ingresos del día: suma de turnos finalizados hoy
  const ingresosDiarios = turnosHoy
    .filter(t => t.estado === 'finalizado')
    .reduce((acc, t) => acc + Number(t.servicio.precio), 0)

  const productosStockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length

  // Adaptar turnos al formato que espera TodayAppointments (mock-data shape)
  const turnosAdaptados = turnosHoy.map(t => ({
    id: String(t.idagenda),
    fecha: t.fecha,
    horaInicio: t.hora_inicio.slice(0, 5),
    horaFin: t.hora_fin.slice(0, 5),
    estado: t.estado as any,
    cliente: { nombre: t.cliente?.persona.nombre_completo ?? 'Sin cliente', telefono: t.cliente?.persona.telefono ?? '' },
    barbero: { nombre: t.barbero?.persona?.nombre_completo ?? '—' },
    servicio: { nombre: t.servicio.nombre_servicio, precio: Number(t.servicio.precio), duracion: t.servicio.duracion_minutos },
    barberoId: String(t.barbero?.idusuario),
    clienteId: '',
    servicioId: '',
    tipoAlta: 'web' as any,
  }))

  // Adaptar barberos al formato que espera BarberPerformance
  const barberosAdaptados = barberos.map(b => ({
    id: String(b.idusuario),
    nombre: b.persona.nombre_completo,
    email: '',
    telefono: '',
    activo: true,
    comision: Number(b.comision_porcentaje),
    especialidades: [],
    estadisticas: {
      turnosMes: 0,
      ingresosMes: 0,
      calificacionPromedio: Number(b.rating_promedio),
      clientesAtendidos: 0,
    },
    fechaIngreso: '',
  }))

  // Adaptar productos al formato que espera LowStockAlert
  const productosAdaptados = productos.map(p => ({
    id: String(p.idproducto),
    nombre: p.nombre_producto,
    stock: p.stock_actual,
    stockMinimo: p.stock_minimo,
    precio: Number(p.precio_venta),
    categoria: p.categoria,
    descripcion: '',
    activo: true,
  }))

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Resumen general del negocio"
        actions={
          <Button className="gap-2" onClick={() => window.location.href = '/admin/agenda'}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo Turno</span>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <DashboardMetrics
          ingresosDiarios={ingresosDiarios}
          turnosHoy={turnosHoy.length}
          clientesActivos={totalClientes}
          productosStockBajo={productosStockBajo}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodayAppointments appointments={turnosAdaptados} />
          </div>
          <div className="space-y-6">
            <BarberPerformance barbers={barberosAdaptados} />
            <LowStockAlert products={productosAdaptados} />
          </div>
        </div>
      </div>
    </>
  )
}
