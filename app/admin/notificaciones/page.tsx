'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, Calendar, DollarSign, Gift, AlertCircle, Check, Trash2, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

type Tipo = 'reserva' | 'recordatorio' | 'promocion' | 'sistema' | 'pago'

type Notificacion = {
  idnotificacion: number
  tipo: Tipo
  titulo: string
  mensaje: string
  leido: boolean
  fecha_creacion: string
}

const notificationIcons: Record<Tipo, React.ElementType> = {
  reserva:     Calendar,
  recordatorio: Bell,
  promocion:   Gift,
  sistema:     AlertCircle,
  pago:        DollarSign,
}

const notificationColors: Record<Tipo, string> = {
  reserva:     'text-primary bg-primary/10',
  recordatorio: 'text-blue-400 bg-blue-400/10',
  promocion:   'text-green-400 bg-green-400/10',
  sistema:     'text-yellow-400 bg-yellow-400/10',
  pago:        'text-emerald-400 bg-emerald-400/10',
}

type ConfigNotif = { notif_nueva_reserva: boolean; notif_recordatorio: boolean; notif_barbero: boolean }

export default function NotificacionesPage() {
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [config, setConfig] = useState<ConfigNotif>({ notif_nueva_reserva: true, notif_recordatorio: true, notif_barbero: true })

  const cargar = async () => {
    try { setNotifs(await api.get<Notificacion[]>('/notificaciones')) }
    catch { setNotifs([]) }
  }

  useEffect(() => {
    cargar()
    api.get<ConfigNotif>('/mi-barberia').then(d => setConfig({
      notif_nueva_reserva: d.notif_nueva_reserva ?? true,
      notif_recordatorio:  d.notif_recordatorio ?? true,
      notif_barbero:       d.notif_barbero ?? true,
    })).catch(() => {})
  }, [])

  const toggleConfig = async (key: keyof ConfigNotif, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    try { await api.put('/mi-barberia', { [key]: value }) } catch {}
  }

  const unreadCount = notifs.filter(n => !n.leido).length

  const marcarLeida = async (id: number) => {
    await api.patch(`/notificaciones/${id}/leer`, {})
    setNotifs(prev => prev.map(n => n.idnotificacion === id ? { ...n, leido: true } : n))
  }

  const marcarTodas = async () => {
    await api.patch('/notificaciones/leer-todas', {})
    setNotifs(prev => prev.map(n => ({ ...n, leido: true })))
  }

  const eliminar = async (id: number) => {
    await api.delete(`/notificaciones/${id}`)
    setNotifs(prev => prev.filter(n => n.idnotificacion !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <>
      <AdminHeader
        title="Notificaciones"
        description="Centro de notificaciones y alertas"
        actions={
          unreadCount > 0 && (
            <Button variant="outline" className="gap-2" onClick={marcarTodas}>
              <CheckCheck className="size-4" />
              <span className="hidden sm:inline">Marcar todo como leído</span>
            </Button>
          )
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de Notificaciones</CardTitle>
            <CardDescription>Gestioná cómo y cuándo se envían las notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificación de reserva al cliente</Label>
                <p className="text-sm text-muted-foreground">Enviar email al registrar una nueva reserva</p>
              </div>
              <Switch checked={config.notif_nueva_reserva} onCheckedChange={v => toggleConfig('notif_nueva_reserva', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Recordatorio previo</Label>
                <p className="text-sm text-muted-foreground">Enviar recordatorio por email y WhatsApp si la reserva es con 2+ días de anticipación</p>
              </div>
              <Switch checked={config.notif_recordatorio} onCheckedChange={v => toggleConfig('notif_recordatorio', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificación al barbero</Label>
                <p className="text-sm text-muted-foreground">Notificar al barbero cuando se le asigna una reserva</p>
              </div>
              <Switch checked={config.notif_barbero} onCheckedChange={v => toggleConfig('notif_barbero', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Historial */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Historial de Notificaciones</CardTitle>
              <CardDescription>
                {unreadCount > 0
                  ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                  : 'Todas las notificaciones leídas'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-3 size-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay notificaciones</p>
                </div>
              ) : notifs.map(n => {
                const Icon = notificationIcons[n.tipo] ?? AlertCircle
                const colorClass = notificationColors[n.tipo] ?? 'text-gray-400 bg-gray-400/10'
                return (
                  <div key={n.idnotificacion} className={cn('flex items-start gap-4 p-4 transition-colors hover:bg-muted/50', !n.leido && 'bg-muted/30')}>
                    <div className={cn('rounded-lg p-2 shrink-0', colorClass)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{n.titulo}</p>
                        {!n.leido && <Badge variant="default" className="h-5 text-xs">Nuevo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.mensaje}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.fecha_creacion)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.leido && (
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => marcarLeida(n.idnotificacion)}>
                          <Check className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => eliminar(n.idnotificacion)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
