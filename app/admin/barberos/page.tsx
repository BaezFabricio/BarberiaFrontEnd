'use client'

import { useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Calendar,
  Star,
  DollarSign,
  Users,
  Eye,
  Power
} from 'lucide-react'
import { barberos } from '@/lib/mock-data'
import { Barber } from '@/lib/types'

export default function BarberosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredBarbers = barberos.filter(barber =>
    barber.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barber.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const activeBarbers = barberos.filter(b => b.activo).length
  const totalIncome = barberos.reduce((acc, b) => acc + b.estadisticas.ingresosMes, 0)
  const totalClients = barberos.reduce((acc, b) => acc + b.estadisticas.turnosMes, 0)

  return (
    <>
      <AdminHeader 
        title="Barberos" 
        description="Gestiona el equipo de barberos"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nuevo Barbero</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Barbero</DialogTitle>
                <DialogDescription>
                  Completa los datos del nuevo barbero
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" placeholder="Ej: Alex Roman" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input id="email" type="email" placeholder="Alex@barberstudio.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input id="telefono" placeholder="+54 11 1234-5678" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comision">Comision (%)</Label>
                  <Input id="comision" type="number" placeholder="35" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pin">PIN de acceso (4 digitos)</Label>
                  <Input 
                    id="pin" 
                    type="password" 
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="****" 
                    className="text-center tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    El barbero usara este PIN para acceder a su portal
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Barberos Activos
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBarbers}</div>
              <p className="text-xs text-muted-foreground">de {barberos.length} registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos del Mes
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">todos los barberos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Turnos del Mes
              </CardTitle>
              <Calendar className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground">clientes atendidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar barbero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbero</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden sm:table-cell">Comision</TableHead>
                  <TableHead className="hidden lg:table-cell">Turnos/Mes</TableHead>
                  <TableHead className="hidden lg:table-cell">Ingresos/Mes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarbers.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(barber.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{barber.nombre}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-primary text-primary" />
                            {barber.estadisticas.calificacionPromedio}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <p>{barber.email}</p>
                        <p className="text-muted-foreground">{barber.telefono}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{barber.comision}%</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {barber.estadisticas.turnosMes}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatCurrency(barber.estadisticas.ingresosMes)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={barber.activo ? 'default' : 'secondary'}>
                        {barber.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 size-4" />
                            Ver agenda
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Power className="mr-2 size-4" />
                            {barber.activo ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
