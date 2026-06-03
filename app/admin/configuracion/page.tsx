'use client'

import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Save,
  Building,
  Clock,
  Globe,
  Bell,
  Users,
  Palette
} from 'lucide-react'
import { infoBarberia } from '@/lib/mock-data'

export default function ConfiguracionPage() {
  return (
    <>
      <AdminHeader 
        title="Configuracion" 
        description="Ajustes generales del sistema"
        actions={
          <Button className="gap-2">
            <Save className="size-4" />
            <span className="hidden sm:inline">Guardar Cambios</span>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="size-5" />
              Informacion del Negocio
            </CardTitle>
            <CardDescription>Datos generales de la barberia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del negocio</Label>
                <Input id="nombre" defaultValue={infoBarberia.nombre} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input id="telefono" defaultValue={infoBarberia.telefono} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="direccion">Direccion</Label>
              <Input id="direccion" defaultValue={infoBarberia.direccion} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input id="email" type="email" defaultValue={infoBarberia.email} />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="size-5" />
              Horarios de Atencion
            </CardTitle>
            <CardDescription>Configura los horarios del local</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Lunes a Viernes</Label>
                <div className="flex items-center gap-2">
                  <Select defaultValue="09:00">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['08:00', '09:00', '10:00'].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">a</span>
                  <Select defaultValue="19:00">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['18:00', '19:00', '20:00', '21:00'].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Sabado</Label>
                <div className="flex items-center gap-2">
                  <Select defaultValue="09:00">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['08:00', '09:00', '10:00'].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">a</span>
                  <Select defaultValue="15:00">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['13:00', '14:00', '15:00', '16:00'].map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Domingo cerrado</Label>
                <p className="text-sm text-muted-foreground">El local permanece cerrado los domingos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5" />
              Configuracion de Reservas
            </CardTitle>
            <CardDescription>Ajustes para el sistema de turnos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Duracion por defecto del turno</Label>
                <Select defaultValue="40">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 40, 45, 60].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} minutos</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tiempo minimo para cancelar</Label>
                <Select defaultValue="60">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 60, 120, 180].map(m => (
                      <SelectItem key={m} value={m.toString()}>
                        {m >= 60 ? `${m / 60} hora${m > 60 ? 's' : ''}` : `${m} minutos`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Permitir reservas online</Label>
                <p className="text-sm text-muted-foreground">Los clientes pueden reservar desde la web publica</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Atencion por orden de llegada</Label>
                <p className="text-sm text-muted-foreground">Permitir atender clientes sin cita si hay disponibilidad</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="grid gap-2">
              <Label>Dias de inactividad para cliente inactivo</Label>
              <Select defaultValue="60">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90].map(d => (
                    <SelectItem key={d} value={d.toString()}>{d} dias</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="size-5" />
              Redes Sociales
            </CardTitle>
            <CardDescription>Enlaces a perfiles sociales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" defaultValue={infoBarberia.redesSociales.instagram} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" defaultValue={infoBarberia.redesSociales.facebook} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" defaultValue={infoBarberia.redesSociales.whatsapp} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
