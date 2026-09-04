'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Clock, CalendarCog, Globe, Palette, CheckCircle, Save, Bell, ImagePlus, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'

type Barberia = {
  nombre_negocio: string; color_primario?: string
  telefono?: string; direccion?: string; correo_negocio?: string
  slogan?: string; color_portada?: string; color_nombre_1?: string; color_nombre_2?: string
  texto_portada_1?: string; texto_portada_2?: string; color_header_1?: string; color_header_2?: string; fuente_header?: string
  maps_embed?: string
  horario_lv_desde?: string; horario_lv_hasta?: string; horario_sab_desde?: string; horario_sab_hasta?: string; domingo_cerrado?: boolean
  duracion_turno?: number; tiempo_cancelacion?: number; tiempo_confirmacion?: number; reservas_online?: boolean; orden_llegada?: boolean; dias_inactividad?: number
  instagram?: string; facebook?: string; whatsapp_negocio?: string
  gmail_remitente?: string; whatsapp_barbero?: string; callmebot_apikey?: string
}

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
  const [negocio, setNegocio] = useState({ nombre: '', telefono: '', direccion: '', correo: '', slogan: '', descripcion: '', color_portada: '#ffffff', color_nombre_1: '#ffffff', color_nombre_2: '#d4a843', texto_portada_1: '', texto_portada_2: '', color_header_1: '#ffffff', color_header_2: '#d4a843', fuente_header: 'Cinzel', maps_embed: '' })
  const [horarios, setHorarios] = useState({ lv_desde: '09:00', lv_hasta: '19:00', sab_desde: '09:00', sab_hasta: '15:00', domingo_cerrado: true })
  const [reservas, setReservas] = useState({ duracion: '40', cancelacion: '60', confirmacion: '60', online: true, orden_llegada: true, inactividad: '60' })
  const [redes, setRedes] = useState({ instagram: '', facebook: '', whatsapp: '' })
  const [notif, setNotif] = useState({ gmail_remitente: '', gmail_password: '', whatsapp_barbero: '', callmebot_apikey: '' })
  const [carrusel, setCarrusel] = useState<{ idimagen: number; url: string }[]>([])
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorHorario, setErrorHorario] = useState('')
  const [probandoEmail, setProbandoEmail] = useState(false)
  const [probandoWA, setProbandoWA] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ tipo: 'email' | 'wa'; ok: boolean; msg: string } | null>(null)

  const probarEmail = async () => {
    setProbandoEmail(true); setResultadoPrueba(null)
    try {
      const r = await api.post<{ mensaje: string }>('/notificaciones/prueba-email', {
        gmail_remitente: notif.gmail_remitente,
        gmail_password:  notif.gmail_password,
      })
      setResultadoPrueba({ tipo: 'email', ok: true, msg: r.mensaje })
    } catch (e: unknown) { setResultadoPrueba({ tipo: 'email', ok: false, msg: e instanceof Error ? e.message : 'Error' }) }
    finally { setProbandoEmail(false) }
  }

  const probarWhatsApp = async () => {
    setProbandoWA(true); setResultadoPrueba(null)
    try {
      const r = await api.post<{ mensaje: string }>('/notificaciones/prueba-whatsapp', {})
      setResultadoPrueba({ tipo: 'wa', ok: true, msg: r.mensaje })
    } catch (e: unknown) { setResultadoPrueba({ tipo: 'wa', ok: false, msg: e instanceof Error ? e.message : 'Error' }) }
    finally { setProbandoWA(false) }
  }
  const [advertenciaHorario, setAdvertenciaHorario] = useState('')

  type HorarioBarbero = { dia_semana: number; hora_apertura: string; hora_cierre: string; barbero_nombre?: string }
  type BarberoConHorario = { idusuario: number; persona: { nombre_completo: string }; horarios: HorarioBarbero[] }

  const cargarCarrusel = () => api.get<{ idimagen: number; url: string }[]>('/carrusel').then(setCarrusel).catch(() => {})

  const subirFotoCarrusel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setSubiendoFoto(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('imagenes', f))
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'
      const token = localStorage.getItem('token')
      const res = await fetch(`${BACKEND_URL}/api/carrusel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      if (!res.ok) throw new Error()
      cargarCarrusel()
    } catch { } finally { setSubiendoFoto(false); e.target.value = '' }
  }

  const eliminarFotoCarrusel = async (id: number) => {
    await api.delete(`/carrusel/${id}`)
    cargarCarrusel()
  }

  useEffect(() => {
    cargarCarrusel()
    api.get<Barberia>('/mi-barberia').then(d => {
      setNegocio({ nombre: d.nombre_negocio, telefono: d.telefono ?? '', direccion: d.direccion ?? '', correo: d.correo_negocio ?? '', slogan: d.slogan ?? '', descripcion: (d as any).descripcion ?? '', color_portada: d.color_portada ?? '#ffffff', color_nombre_1: d.color_nombre_1 ?? '#ffffff', color_nombre_2: d.color_nombre_2 ?? '#d4a843', texto_portada_1: d.texto_portada_1 ?? '', texto_portada_2: d.texto_portada_2 ?? '', color_header_1: d.color_header_1 ?? '#ffffff', color_header_2: d.color_header_2 ?? '#d4a843', fuente_header: d.fuente_header ?? 'Cinzel', maps_embed: d.maps_embed ?? '' })
      if (d.color_primario) { setColor(d.color_primario); aplicarColor(d.color_primario) }
      setHorarios({ lv_desde: d.horario_lv_desde ?? '09:00', lv_hasta: d.horario_lv_hasta ?? '19:00', sab_desde: d.horario_sab_desde ?? '09:00', sab_hasta: d.horario_sab_hasta ?? '15:00', domingo_cerrado: d.domingo_cerrado ?? true })
      setReservas({ duracion: String(d.duracion_turno ?? 40), cancelacion: String(d.tiempo_cancelacion ?? 60), confirmacion: String(d.tiempo_confirmacion ?? 60), online: d.reservas_online ?? true, orden_llegada: d.orden_llegada ?? true, inactividad: String(d.dias_inactividad ?? 60) })
      setRedes({ instagram: d.instagram ?? '', facebook: d.facebook ?? '', whatsapp: d.whatsapp_negocio ?? '' })
      setNotif(p => ({ ...p, gmail_remitente: d.gmail_remitente ?? '', whatsapp_barbero: d.whatsapp_barbero ?? '', callmebot_apikey: d.callmebot_apikey ?? '' }))
    }).catch(() => {})
  }, [])

  const handleColorChange = (hex: string) => { setColor(hex); aplicarColor(hex, false) }

  const validarHorarios = async () => {
    setErrorHorario(''); setAdvertenciaHorario('')
    try {
      const barberos = await api.get<BarberoConHorario[]>('/barberos')
      const advertencias: string[] = []
      const toMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm }
      const horarioNegocio = horarios
      for (const b of barberos) {
        const horariosB = await api.get<HorarioBarbero[]>(`/barberos/${b.idusuario}/horarios`)
        for (const h of horariosB) {
          const esSab = h.dia_semana === 6
          const esDom = h.dia_semana === 7
          if (esDom && horarioNegocio.domingo_cerrado === true) {
            advertencias.push(`${b.persona.nombre_completo} tiene horario el domingo pero el local está cerrado ese día`)
            continue
          }
          const negDesde = toMin(esSab ? horarioNegocio.sab_desde : horarioNegocio.lv_desde)
          const negHasta = toMin(esSab ? horarioNegocio.sab_hasta : horarioNegocio.lv_hasta)
          const barbDesde = toMin(h.hora_apertura.slice(0, 5))
          const barbHasta = toMin(h.hora_cierre.slice(0, 5))
          if (barbDesde < negDesde || barbHasta > negHasta) {
            advertencias.push(`${b.persona.nombre_completo} — día ${h.dia_semana}: ${h.hora_apertura.slice(0,5)}–${h.hora_cierre.slice(0,5)} está fuera del horario del local`)
          }
        }
      }
      if (advertencias.length) setAdvertenciaHorario(advertencias.join('\n'))
    } catch { /* no bloquear si falla */ }
  }

  const handleGuardar = async () => {
    setGuardando(true); setExito(false)
    try {
      await api.put('/mi-barberia', {
        nombre_negocio:      negocio.nombre,
        telefono:            negocio.telefono,
        direccion:           negocio.direccion,
        correo_negocio:      negocio.correo,
        slogan:              negocio.slogan,
        descripcion:         negocio.descripcion,
        color_portada:       negocio.color_portada,
        color_nombre_1:      negocio.color_nombre_1,
        color_nombre_2:      negocio.color_nombre_2,
        texto_portada_1:     negocio.texto_portada_1,
        texto_portada_2:     negocio.texto_portada_2,
        color_header_1:      negocio.color_header_1,
        color_header_2:      negocio.color_header_2,
        fuente_header:       negocio.fuente_header,
        maps_embed:          negocio.maps_embed,
        color_primario:      color,
        horario_lv_desde:    horarios.lv_desde,
        horario_lv_hasta:    horarios.lv_hasta,
        horario_sab_desde:   horarios.sab_desde,
        horario_sab_hasta:   horarios.sab_hasta,
        domingo_cerrado:     horarios.domingo_cerrado,
        duracion_turno:      Number(reservas.duracion),
        tiempo_cancelacion:  Number(reservas.cancelacion),
        tiempo_confirmacion: Number(reservas.confirmacion),
        reservas_online:     reservas.online,
        orden_llegada:       reservas.orden_llegada,
        dias_inactividad:    Number(reservas.inactividad),
        instagram:           redes.instagram,
        facebook:            redes.facebook,
        whatsapp_negocio:    redes.whatsapp,
        gmail_remitente:     notif.gmail_remitente,
        gmail_password:      notif.gmail_password || undefined,
        whatsapp_barbero:    notif.whatsapp_barbero,
        callmebot_apikey:    notif.callmebot_apikey,
      })
      aplicarColor(color, true)
      setExito(true)
      setTimeout(() => setExito(false), 3000)
      await validarHorarios()
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">

        {/* Información del negocio - col span 2 */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Slogan</Label>
            <Input value={negocio.slogan} onChange={e => setNegocio(p => ({ ...p, slogan: e.target.value }))} placeholder="El mejor corte de la ciudad" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descripción (sección "Sobre nosotros" en la landing)</Label>
            <Textarea rows={4} value={negocio.descripcion} onChange={e => setNegocio(p => ({ ...p, descripcion: e.target.value }))} placeholder="Contá la historia de la barbería, tus valores, años de experiencia..." className="resize-none text-sm" />
          </div>
        </div>

        {/* Horarios */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Clock} title="Horarios de Atencion" subtitle="Configura los horarios del local" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {advertenciaHorario && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-yellow-500">⚠ Conflictos con horarios de barberos</p>
              {advertenciaHorario.split('\n').map((msg, i) => (
                <p key={i} className="text-xs text-yellow-400">{msg}</p>
              ))}
              <p className="text-xs text-muted-foreground mt-1">Revisá los horarios individuales en el módulo de Barberos.</p>
            </div>
          )}
        </div>

        {/* Reservas */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={CalendarCog} title="Configuracion de Reservas" subtitle="Ajustes para el sistema de turnos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Duracion por defecto del turno</Label>
              <Select value={reservas.duracion} onValueChange={v => setReservas(p => ({ ...p, duracion: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="40">40 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1.5 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tiempo mínimo para cancelar</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tiempo para confirmar reserva</Label>
              <Select value={reservas.confirmacion} onValueChange={v => setReservas(p => ({ ...p, confirmacion: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
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
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Google Maps — URL del embed</Label>
              <Input value={negocio.maps_embed} onChange={e => setNegocio(p => ({ ...p, maps_embed: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." />
              <p className="text-xs text-muted-foreground">En Google Maps → Compartir → Insertar un mapa → copiá solo la URL del <code>src</code></p>
            </div>
          </div>
        </div>

        {/* Notificaciones - col span 2 */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-6">
          <SectionTitle icon={Bell} title="Notificaciones" subtitle="Configurá el email para avisar a clientes" />

          {/* Email */}
          <div className="space-y-3 max-w-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gmail (para enviar emails)</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Correo remitente</Label>
              <Input value={notif.gmail_remitente} onChange={e => setNotif(p => ({ ...p, gmail_remitente: e.target.value }))} placeholder="tunegocio@gmail.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Contraseña de aplicación</Label>
              <Input type="password" value={notif.gmail_password} onChange={e => setNotif(p => ({ ...p, gmail_password: e.target.value }))} placeholder="xxxx xxxx xxxx xxxx" />
              <p className="text-[11px] text-muted-foreground">Generala en Google → Seguridad → Contraseñas de aplicaciones</p>
            </div>
            <Button variant="outline" size="sm" onClick={probarEmail} disabled={probandoEmail} className="gap-2 text-xs">
              {probandoEmail ? 'Enviando...' : 'Enviar email de prueba'}
            </Button>
            {resultadoPrueba?.tipo === 'email' && (
              <p className={`text-xs ${resultadoPrueba.ok ? 'text-green-500' : 'text-destructive'}`}>{resultadoPrueba.msg}</p>
            )}
          </div>

        </div>

        {/* Carrusel de fotos */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={ImagePlus} title="Fotos del carrusel" subtitle="Se muestran en el hero de la página pública — podés subir varias" />
          <div className="flex flex-wrap gap-3">
            {carrusel.map((img, idx) => (
              <div key={img.idimagen} className="relative group w-36 h-24 rounded-lg overflow-hidden border border-border">
                <img src={img.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => eliminarFotoCarrusel(img.idimagen)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Principal</span>
                )}
              </div>
            ))}

            {/* Botón agregar */}
            <label className={`relative flex w-36 h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary ${subiendoFoto ? 'pointer-events-none opacity-50' : ''}`}>
              {subiendoFoto ? (
                <>
                  <span className="text-xs">Subiendo...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="size-5" />
                  <span className="text-xs font-medium">Agregar fotos</span>
                </>
              )}
              <input type="file" accept="image/*" multiple className="hidden" onChange={subirFotoCarrusel} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WEBP · Máx. 5 MB por imagen · La primera foto es la que aparece primero.</p>
        </div>

        {/* Nombre en header — fuente y colores */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <SectionTitle icon={Palette} title="Nombre en el header" subtitle="Fuente y colores del nombre que aparece en la página pública" />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fuente</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Cinzel','Playfair Display','Oswald','Bebas Neue','Abril Fatface','inherit'] as const).map(f => (
                <button key={f} type="button"
                  onClick={() => setNegocio(p => ({ ...p, fuente_header: f }))}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${negocio.fuente_header === f ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <span className="block text-xs text-muted-foreground mb-1">{f === 'inherit' ? 'Por defecto' : f}</span>
                  <span style={{ fontFamily: f === 'inherit' ? undefined : `var(--font-${({'Cinzel':'cinzel','Playfair Display':'playfair','Oswald':'oswald','Bebas Neue':'bebas','Abril Fatface':'abril'} as Record<string,string>)[f] ?? 'cinzel'}), serif`, fontSize: '18px' }}>
                    {negocio.nombre || 'Mi Barbería'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Color primera palabra</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={negocio.color_header_1 ?? '#ffffff'}
                  onChange={e => setNegocio(p => ({ ...p, color_header_1: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                <Input value={negocio.color_header_1 ?? '#ffffff'}
                  onChange={e => e.target.value.match(/^#[0-9a-fA-F]{0,6}$/) && setNegocio(p => ({ ...p, color_header_1: e.target.value }))}
                  className="h-8 w-28 font-mono text-xs" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Color resto de palabras</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={negocio.color_header_2 ?? '#d4a843'}
                  onChange={e => setNegocio(p => ({ ...p, color_header_2: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5" />
                <Input value={negocio.color_header_2 ?? '#d4a843'}
                  onChange={e => e.target.value.match(/^#[0-9a-fA-F]{0,6}$/) && setNegocio(p => ({ ...p, color_header_2: e.target.value }))}
                  className="h-8 w-28 font-mono text-xs" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <span style={{ fontFamily: negocio.fuente_header === 'inherit' ? undefined : `var(--font-${({'Cinzel':'cinzel','Playfair Display':'playfair','Oswald':'oswald','Bebas Neue':'bebas','Abril Fatface':'abril'} as Record<string,string>)[negocio.fuente_header] ?? 'cinzel'}), serif`, fontSize: '22px' }}>
                {negocio.nombre.split(' ').map((p, i) => (
                  <span key={i} style={{ color: i === 0 ? (negocio.color_header_1 ?? '#ffffff') : (negocio.color_header_2 ?? '#d4a843') }}>
                    {i > 0 ? ' ' : ''}{p}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Color del sistema - col span 2 */}
        <div className="col-span-1 md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
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
