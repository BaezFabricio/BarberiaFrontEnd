'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Clock, CalendarCog, Globe, Palette, CheckCircle, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'

type Barberia = { nombre_negocio: string; color_primario?: string }

const COLORES_PRESET = [
  { label: 'Dorado',  hex: '#d4a843' },
  { label: 'Blanco',  hex: '#eeeeee' },
  { label: 'Rojo',    hex: '#e53e3e' },
  { label: 'Azul',    hex: '#3182ce' },
  { label: 'Verde',   hex: '#38a169' },
  { label: 'Violeta', hex: '#805ad5' },
  { label: 'Naranja', hex: '#dd6b20' },
  { label: 'Rosa',    hex: '#d53f8c' },
  { label: 'Celeste', hex: '#00b5d8' },
  { label: 'Oscuro',  hex: '#4a4a4a' },
]

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType, title: string, subtitle: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <h2 className="font-semibold text-sm">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

export default function ConfiguracionPage() {
  const [color, setColor] = useState('#d4a843')
  const [negocio, setNegocio] = useState({ nombre: '', telefono: '', direccion: '', correo: '' })
  const [horarios, setHorarios] = useState({ lv_desde: '09:00', lv_hasta: '19:00', sab_desde: '09:00', sab_hasta: '15:00', domingo_cerrado: true })
  const [reservas, setReservas] = useState({ duracion: '40', cancelacion: '60', online: true, orden_llegada: true, inactividad: '60' })
  const [redes, setRedes] = useState({ instagram: '', facebook: '', whatsapp: '' })
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  useEffect(() => {
    api.get<Barberia>('/mi-barberia').then(d => {
      setNegocio(p => ({ ...p, nombre: d.nombre_negocio }))
      if (d.color_primario) { setColor(d.color_primario); aplicarColor(d.color_primario) }
    }).catch(() => {})
  }, [])

  const handleColorChange = (hex: string) => { setColor(hex); aplicarColor(hex, false) }

  const handleGuardar = async () => {
    setGuardando(true); setExito(false)
    try {
      await api.put('/mi-barberia', { nombre_negocio: negocio.nombre, color_primario: color })
      aplicarColor(color, true)
      setExito(true)
      setTimeout(() => setExito(false), 3000)
    } finally { setGuardando(false) }
  }

  const horas = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2,'0')}:00`)

  return (
    <>
      <AdminHeader
        title="Configuracion"
        description="Ajustes generales del sistema"
        actions={
          <Button onClick={handleGuardar} disabled={guardando} size="sm" className="gap-2">
            {exito ? <CheckCircle className="size-4" /> : <Save className="size-4" />}
            {guardando ? 'Guardando...' : exito ? 'Guardado' : 'Guardar Cambios'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 p-6">

        {/* Información del negocio - col span 2 */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Building2} title="Informacion del Negocio" subtitle="Datos generales de la barbería" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre del negocio</Label>
              <Input value={negocio.nombre} onChange={e => setNegocio(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefono</Label>
              <Input value={negocio.telefono} onChange={e => setNegocio(p => ({ ...p, telefono: e.target.value }))} placeholder="+54 11 4567-8900" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Direccion</Label>
            <Input value={negocio.direccion} onChange={e => setNegocio(p => ({ ...p, direccion: e.target.value }))} placeholder="Corrientes y Eva Perón, Formosa" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Correo electronico</Label>
            <Input value={negocio.correo} onChange={e => setNegocio(p => ({ ...p, correo: e.target.value }))} placeholder="info@barberstudio.com" />
          </div>
        </div>

        {/* Horarios */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Clock} title="Horarios de Atencion" subtitle="Configura los horarios del local" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Lunes a Viernes</Label>
              <div className="flex items-center gap-2">
                <Select value={horarios.lv_desde} onValueChange={v => setHorarios(p => ({ ...p, lv_desde: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{horas.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground shrink-0">a</span>
                <Select value={horarios.lv_hasta} onValueChange={v => setHorarios(p => ({ ...p, lv_hasta: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{horas.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sabado</Label>
              <div className="flex items-center gap-2">
                <Select value={horarios.sab_desde} onValueChange={v => setHorarios(p => ({ ...p, sab_desde: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{horas.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground shrink-0">a</span>
                <Select value={horarios.sab_hasta} onValueChange={v => setHorarios(p => ({ ...p, sab_hasta: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{horas.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Domingo cerrado</p>
              <p className="text-xs text-muted-foreground">El local permanece cerrado los domingos</p>
            </div>
            <Switch checked={horarios.domingo_cerrado} onCheckedChange={v => setHorarios(p => ({ ...p, domingo_cerrado: v }))} />
          </div>
        </div>

        {/* Reservas */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={CalendarCog} title="Configuracion de Reservas" subtitle="Ajustes para el sistema de turnos" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Duracion por defecto del turno</Label>
              <Select value={reservas.duracion} onValueChange={v => setReservas(p => ({ ...p, duracion: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="40">40 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tiempo minimo para cancelar</Label>
              <Select value={reservas.cancelacion} onValueChange={v => setReservas(p => ({ ...p, cancelacion: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                  <SelectItem value="1440">24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Permitir reservas online</p>
                <p className="text-xs text-muted-foreground">Los clientes pueden reservar desde la web publica</p>
              </div>
              <Switch checked={reservas.online} onCheckedChange={v => setReservas(p => ({ ...p, online: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Atencion por orden de llegada</p>
                <p className="text-xs text-muted-foreground">Permitir atender clientes sin cita si hay disponibilidad</p>
              </div>
              <Switch checked={reservas.orden_llegada} onCheckedChange={v => setReservas(p => ({ ...p, orden_llegada: v }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dias de inactividad para cliente inactivo</Label>
            <Select value={reservas.inactividad} onValueChange={v => setReservas(p => ({ ...p, inactividad: v }))}>
              <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="180">180 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Globe} title="Redes Sociales" subtitle="Enlaces a perfiles sociales" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Instagram</Label>
              <Input value={redes.instagram} onChange={e => setRedes(p => ({ ...p, instagram: e.target.value }))} placeholder="@barberstudio_" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Facebook</Label>
              <Input value={redes.facebook} onChange={e => setRedes(p => ({ ...p, facebook: e.target.value }))} placeholder="BarberStudio" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input value={redes.whatsapp} onChange={e => setRedes(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+54 11 4567-8900" />
            </div>
          </div>
        </div>

        {/* Color del sistema - col span 2 */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Palette} title="Color del sistema" subtitle="Color principal en botones y acentos de toda la interfaz" />
          <div className="flex flex-wrap gap-2.5">
            {COLORES_PRESET.map(c => (
              <button key={c.hex} title={c.label} onClick={() => handleColorChange(c.hex)}
                className={`relative size-8 rounded-full border-2 transition-all hover:scale-110 ${color.toLowerCase() === c.hex ? 'border-foreground scale-110 shadow-md' : 'border-transparent'}`}
                style={{ backgroundColor: c.hex }}>
                {color.toLowerCase() === c.hex && (
                  <CheckCircle className="absolute inset-0 m-auto size-4 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Color personalizado</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => handleColorChange(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                <Input value={color} onChange={e => e.target.value.match(/^#[0-9a-fA-F]{0,6}$/) && handleColorChange(e.target.value)}
                  className="h-8 w-28 font-mono text-xs" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="flex items-center gap-2">
                <div className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: color }}>Botón</div>
                <span className="text-sm font-semibold" style={{ color }}>Texto activo</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
