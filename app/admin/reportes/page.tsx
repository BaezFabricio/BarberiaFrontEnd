'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { DollarSign, Scissors, ShoppingBag, TrendingUp, Users, XCircle, UserX, TrendingDown } from 'lucide-react'

type Resumen = {
  ingresos_total: number; ingresos_servicios: number; ingresos_productos: number
  turnos_atendidos: number; atendidos_sin_cobrar: number; ticket_promedio: number; productos_vendidos: number
  turnos_ausentes: number; turnos_cancelados: number
  gastos_total: number; ganancia_neta: number
}
type DiaIngreso = { fecha: string; total: number }
type MetodoPago = { metodo: string; total: number }
type EstadoTurno = { estado: string; cantidad: number }
type Barbero = { nombre: string; turnos: number; ingresos: number }
type ServicioTop = { nombre: string; cantidad: number }
type ProductoTop = { nombre: string; cantidad: number; ingresos: number }

type Reporte = {
  resumen: Resumen
  ingresos_por_dia: DiaIngreso[]
  metodos_pago: MetodoPago[]
  turnos_por_estado: EstadoTurno[]
  ranking_barberos: Barbero[]
  servicios_top: ServicioTop[]
  productos_top: ProductoTop[]
}

const COLORS = ['#a78bfa', '#34d399', '#60a5fa', '#f97316', '#f43f5e', '#facc15', '#22d3ee']

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

const fmtFecha = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', confirmado: 'Confirmado', atendido: 'Atendido',
  cobrado: 'Cobrado', ausente: 'Ausente', cancelado: 'Cancelado', archivado: 'Archivado'
}

const hoy = new Date().toISOString().split('T')[0]
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function ReportesPage() {
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoy)
  const [data, setData] = useState<Reporte | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    setCargando(true)
    try {
      const r = await api.get<Reporte>(`/reportes?desde=${desde}&hasta=${hasta}`)
      setData(r)
    } catch { setData(null) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [desde, hasta])

  const r = data?.resumen

  return (
    <>
      <AdminHeader
        title="Reportes"
        description="Estadísticas del negocio"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-32 text-sm" />
            <span className="text-muted-foreground text-sm">—</span>
            <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-32 text-sm" />
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {cargando ? (
          <p className="text-center text-sm text-muted-foreground py-20">Cargando reportes...</p>
        ) : !data ? (
          <p className="text-center text-sm text-destructive py-20">Error al cargar datos</p>
        ) : (
          <>
            {/* ── Tarjetas resumen ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos totales</CardTitle>
                  <DollarSign className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{fmt(r!.ingresos_total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Servicios {fmt(r!.ingresos_servicios)} · Productos {fmt(r!.ingresos_productos)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Turnos atendidos</CardTitle>
                  <Scissors className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{r!.turnos_atendidos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ticket promedio {fmt(r!.ticket_promedio)} · Sin cobrar {r!.atendidos_sin_cobrar}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Productos vendidos</CardTitle>
                  <ShoppingBag className="size-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{r!.productos_vendidos}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ingresos {fmt(r!.ingresos_productos)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ausentes / Cancelados</CardTitle>
                  <XCircle className="size-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{r!.turnos_ausentes + r!.turnos_cancelados}</p>
                  <p className="text-xs text-muted-foreground mt-1">Ausentes {r!.turnos_ausentes} · Cancelados {r!.turnos_cancelados}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de gastos</CardTitle>
                  <TrendingDown className="size-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-400">{fmt(r!.gastos_total ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Egresos del período</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ganancia neta</CardTitle>
                  <TrendingUp className="size-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${(r!.ganancia_neta ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(r!.ganancia_neta ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ingresos − Gastos</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Ingresos por día ── */}
            <Card>
              <CardHeader><CardTitle className="text-base">Ingresos por día</CardTitle></CardHeader>
              <CardContent>
                {data.ingresos_por_dia.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Sin datos en este período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.ingresos_por_dia.map(d => ({ ...d, fecha: fmtFecha(d.fecha) }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={40} />
                      <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Ingresos']} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                      <Bar dataKey="total" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ── Métodos de pago + Turnos por estado ── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Métodos de pago</CardTitle></CardHeader>
                <CardContent>
                  {data.metodos_pago.every(m => m.total === 0) ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Sin datos</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.metodos_pago.filter(m => m.total > 0)} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                          {data.metodos_pago.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#ccc' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Turnos por estado</CardTitle></CardHeader>
                <CardContent>
                  {data.turnos_por_estado.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Sin datos</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.turnos_por_estado.map(d => ({ ...d, estado: ESTADO_LABEL[d.estado] ?? d.estado }))} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                          {data.turnos_por_estado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#ccc' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Ranking barberos ── */}
            <Card>
              <CardHeader><CardTitle className="text-base">Rendimiento por barbero</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data.ranking_barberos.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">Sin datos</p>
                ) : (() => {
                  const max = Math.max(...data.ranking_barberos.map(b => b.ingresos), 1)
                  return data.ranking_barberos.map((b, i) => (
                    <div key={b.nombre} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-medium">{b.nombre}</span>
                          <span className="text-xs text-muted-foreground">{b.turnos} turnos</span>
                        </div>
                        <span className="font-semibold text-primary">{fmt(b.ingresos)}</span>
                      </div>
                      <Progress value={(b.ingresos / max) * 100} className="h-1.5" />
                    </div>
                  ))
                })()}
              </CardContent>
            </Card>

            {/* ── Servicios + Productos más vendidos ── */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Servicios más solicitados</CardTitle></CardHeader>
                <CardContent>
                  {data.servicios_top.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">Sin datos</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart layout="vertical" data={data.servicios_top} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#ccc' }} width={110} />
                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                        <Bar dataKey="cantidad" fill="#34d399" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#888' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Productos más vendidos</CardTitle></CardHeader>
                <CardContent>
                  {data.productos_top.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">Sin ventas en este período</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart layout="vertical" data={data.productos_top} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: '#ccc' }} width={110} />
                        <Tooltip formatter={(v, name) => [name === 'ingresos' ? fmt(Number(v ?? 0)) : v, name === 'ingresos' ? 'Ingresos' : 'Cantidad']} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                        <Bar dataKey="cantidad" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
