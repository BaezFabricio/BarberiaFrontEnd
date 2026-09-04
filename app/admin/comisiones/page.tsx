'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { DollarSign, Scissors, TrendingUp, Calendar } from 'lucide-react'

type BarberoComision = {
  idusuario: number
  nombre: string
  comision_porcentaje: number
  turnos: number
  monto_generado: number
  monto_comision: number
}

type Respuesta = {
  barberos: BarberoComision[]
  total_comisiones: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

const hoy = new Date().toISOString().split('T')[0]

const presets = [
  {
    label: 'Hoy',
    desde: () => hoy,
    hasta: () => hoy,
  },
  {
    label: 'Esta semana',
    desde: () => {
      const d = new Date()
      d.setDate(d.getDate() - d.getDay() + 1)
      return d.toISOString().split('T')[0]
    },
    hasta: () => hoy,
  },
  {
    label: 'Este mes',
    desde: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    hasta: () => hoy,
  },
  {
    label: 'Mes anterior',
    desde: () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    hasta: () => new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
  },
]

export default function ComisionesPage() {
  const [desde, setDesde] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [hasta, setHasta]       = useState(hoy)
  const [data, setData]         = useState<Respuesta | null>(null)
  const [cargando, setCargando] = useState(true)
  const [preset, setPreset]     = useState('Este mes')

  const cargar = (d: string, h: string) => {
    setCargando(true)
    api.get<Respuesta>(`/comisiones?desde=${d}&hasta=${h}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar(desde, hasta) }, [])

  const aplicarPreset = (p: typeof presets[0]) => {
    const d = p.desde()
    const h = p.hasta()
    setDesde(d); setHasta(h); setPreset(p.label); cargar(d, h)
  }

  const aplicarRango = () => { setPreset(''); cargar(desde, hasta) }

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <AdminHeader
        title="Comisiones"
        description="Cuánto le corresponde pagar a cada barbero según su comisión."
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map(p => (
          <button
            key={p.label}
            onClick={() => aplicarPreset(p)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
              preset === p.label
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <input
            type="date" value={desde} max={hasta}
            onChange={e => { setDesde(e.target.value); setPreset('') }}
            className="h-8 rounded-lg border border-border/60 bg-background px-2 text-sm text-foreground"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <input
            type="date" value={hasta} min={desde} max={hoy}
            onChange={e => { setHasta(e.target.value); setPreset('') }}
            className="h-8 rounded-lg border border-border/60 bg-background px-2 text-sm text-foreground"
          />
          {!preset && (
            <button
              onClick={aplicarRango}
              className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Aplicar
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Calculando comisiones...
        </div>
      ) : !data || data.barberos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <DollarSign className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Sin cobros registrados en este período</p>
        </div>
      ) : (
        <>
          {/* Total a pagar */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total a pagar en comisiones</p>
              <p className="text-4xl font-black text-primary mt-0.5">{fmt(data.total_comisiones)}</p>
            </div>
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-7 text-primary" />
            </div>
          </div>

          {/* Cards por barbero */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.barberos.map(b => (
              <div key={b.idusuario} className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                {/* Header barbero */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                  <div className="size-10 rounded-full bg-primary/15 ring-2 ring-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{initials(b.nombre)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.nombre}</p>
                    <p className="text-xs text-muted-foreground">{b.comision_porcentaje}% de comisión</p>
                  </div>
                  {/* Badge monto a pagar */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">Le corresponde</p>
                    <p className="text-lg font-black text-primary">{fmt(b.monto_comision)}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-border/40">
                  <div className="px-5 py-3.5 flex items-center gap-2.5">
                    <Scissors className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Turnos atendidos</p>
                      <p className="text-base font-bold">{b.turnos}</p>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 flex items-center gap-2.5">
                    <TrendingUp className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos generados</p>
                      <p className="text-base font-bold">{fmt(b.monto_generado)}</p>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="px-5 pb-4">
                  <div className="w-full h-1.5 rounded-full bg-border/30 mt-1">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${b.comision_porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Para el negocio: {fmt(b.monto_generado - b.monto_comision)}</span>
                    <span className="text-[10px] text-primary font-medium">Para el barbero: {fmt(b.monto_comision)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
