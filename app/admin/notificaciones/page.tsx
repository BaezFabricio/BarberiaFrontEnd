'use client'

import { useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell,
  Calendar,
  Mail,
  MessageCircle,
  Check,
  Clock,
  Gift,
  AlertCircle,
  Trash2,
  CheckCheck
} from 'lucide-react'
import { notificaciones } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const notificationIcons = {
  reserva: Calendar,
  recordatorio: Clock,
  promocion: Gift,
  sistema: AlertCircle,
}

const notificationColors = {
  reserva: 'text-primary bg-primary/10',
  recordatorio: 'text-blue-400 bg-blue-400/10',
  promocion: 'text-success bg-success/10',
  sistema: 'text-warning bg-warning/10',
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState(notificaciones)

  const unreadCount = notifications.filter(n => !n.leida).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} dias`
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  return (
    <>
      <AdminHeader 
        title="Notificaciones" 
        description="Centro de notificaciones y alertas"
        actions={
          unreadCount > 0 && (
            <Button variant="outline" className="gap-2" onClick={markAllAsRead}>
              <CheckCheck className="size-4" />
              <span className="hidden sm:inline">Marcar todo como leido</span>
            </Button>
          )
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuracion de Notificaciones</CardTitle>
            <CardDescription>Gestiona como y cuando se envian las notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificacion de reserva al cliente</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar email al registrar una nueva reserva
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Recordatorio previo</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorio por email y WhatsApp si la reserva es con 2+ dias de anticipacion
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificacion al barbero</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar al barbero cuando se le asigna una reserva
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Promociones a clientes inactivos</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar ofertas y recordatorios a clientes que no visitan hace 60+ dias
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Beneficios para clientes frecuentes</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar promociones especiales a clientes con 10+ turnos
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Historial de Notificaciones</CardTitle>
              <CardDescription>
                {unreadCount > 0 
                  ? `${unreadCount} notificacion${unreadCount > 1 ? 'es' : ''} sin leer`
                  : 'Todas las notificaciones leidas'
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-3 size-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay notificaciones</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = notificationIcons[notification.tipo]
                  const colorClass = notificationColors[notification.tipo]
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-4 p-4 transition-colors hover:bg-muted/50',
                        !notification.leida && 'bg-muted/30'
                      )}
                    >
                      <div className={cn('rounded-lg p-2', colorClass)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.titulo}</p>
                          {!notification.leida && (
                            <Badge variant="default" className="h-5 text-xs">Nuevo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.mensaje}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(notification.fecha)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.leida && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="size-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
