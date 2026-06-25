'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { DashboardMetrics } from '@/components/admin/dashboard-metrics'
import { TodayAppointments } from '@/components/admin/today-appointments'
import { BarberPerformance } from '@/components/admin/barber-performance'
import { LowStockAlert } from '@/components/admin/low-stock-alert'
import { Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
type Pago = { monto_pago: number }
type Inactivos = { dias_config: number; inactivos: { idcliente: number }[] }
type RankingBarbero = { nombre: string; turnos: number; ingresos: number }
type Reportes = { ranking_barberos: RankingBarbero[] }

type Periodo = 'hoy' | 'semana' | 'mes'

function getRango(periodo: Periodo): { desde: string; hasta: string } {
  const hoy = new Date()
  const hasta = hoy.toISOString().split('T')[0]
  if (periodo === 'hoy') return { desde: hasta, hasta }
  if (periodo === 'semana') {
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
    return { desde: lunes.toISOString().split('T')[0], hasta }
  }
  return { desde: hasta.slice(0, 8) + '01', hasta }
}

export default function AdminDashboard() {
  const hoy = new Date().toISOString().split('T')[0]
  const [periodo, setPeriodo] = useState<Periodo>('mes')

  const [turnosHoy, setTurnosHoy] = useState<Turno[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [totalClientes, setTotalClientes] = useState(0)
  const [inactivosCount, setInactivosCount] = useState(0)
  const [pagosRango, setPagosRango] = useState<Pago[]>([])
  const [rankingRango, setRankingRango] = useState<RankingBarbero[]>([])

  // Carga estática (no cambia con el período)
  useEffect(() => {
    Promise.allSettled([
      api.get<Turno[]>(`/turnos?fecha=${hoy}`),
      api.get<Barbero[]>('/barberos'),
      api.get<Producto[]>('/productos'),
      api.get<Cliente[]>('/clientes'),
      api.get<Inactivos>('/clientes/inactivos'),
    ]).then(([turnos, barbs, prods, clts, inactivos]) => {
      if (turnos.status === 'fulfilled') setTurnosHoy(turnos.value)
      if (barbs.status === 'fulfilled') setBarberos(barbs.value)
      if (prods.status === 'fulfilled') setProductos(prods.value)
      if (clts.status === 'fulfilled') setTotalClientes(clts.value.length)
      if (inactivos.status === 'fulfilled') setInactivosCount(inactivos.value.inactivos.length)
    })
  }, [hoy])

  // Carga dinámica según período seleccionado
  useEffect(() => {
    const { desde, hasta } = getRango(periodo)
    Promise.allSettled([
      api.get<Pago[]>(`/pagos?desde=${desde}&hasta=${hasta}`),
      api.get<Reportes>(`/reportes?desde=${desde}&hasta=${hasta}`),
    ]).then(([pagos, reportes]) => {
      if (pagos.status === 'fulfilled') setPagosRango(pagos.value)
      if (reportes.status === 'fulfilled') setRankingRango(reportes.value.ranking_barberos)
    })
  }, [periodo])

  const ingresosDiarios = pagosRango.reduce((acc, p) => acc + Number(p.monto_pago), 0)

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
    tipo: 'reserva_previa' as const,
    precioFinal: Number(t.servicio.precio),
    fechaCreacion: t.fecha,
  }))

  // Adaptar barberos al formato que espera BarberPerformance
  const barberosAdaptados = barberos.map(b => {
    const stats = rankingRango.find(r => r.nombre === b.persona.nombre_completo)
    return {
      id: String(b.idusuario),
      nombre: b.persona.nombre_completo,
      email: '',
      telefono: '',
      activo: true,
      comision: Number(b.comision_porcentaje),
      especialidades: [],
      estadisticas: {
        turnosMes: stats?.turnos ?? 0,
        ingresosMes: stats?.ingresos ?? 0,
        calificacionPromedio: Number(b.rating_promedio),
        clientesAtendidos: 0,
      },
      fechaIngreso: '',
    }
  })

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
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
              <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={() => window.location.href = '/admin/agenda'}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo Turno</span>
            </Button>
          </div>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6 overflow-x-hidden">
        <DashboardMetrics
          ingresosDiarios={ingresosDiarios}
          periodo={periodo}
          turnosHoy={turnosHoy.length}
          turnosConfirmados={turnosHoy.filter(t => t.estado === 'confirmado').length}
          turnosPendientes={turnosHoy.filter(t => t.estado === 'pendiente').length}
          clientesActivos={totalClientes}
          clientesInactivos={inactivosCount}
          productosStockBajo={productosStockBajo}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodayAppointments appointments={turnosAdaptados as any} />
          </div>
          <div className="space-y-6">
            <BarberPerformance barbers={barberosAdaptados as any} />
            <LowStockAlert products={productosAdaptados} />
          </div>
        </div>
      </div>
    </>
  )
}
