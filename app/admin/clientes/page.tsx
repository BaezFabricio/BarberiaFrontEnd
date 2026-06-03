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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Calendar,
  Star,
  Users,
  UserPlus,
  UserX,
  Eye,
  Mail,
  Phone,
  MessageCircle
} from 'lucide-react'
import { clientes, turnos } from '@/lib/mock-data'
import { Client } from '@/lib/types'

export default function ClientesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'frecuentes' | 'nuevos' | 'inactivos'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate inactive clients (60+ days without visit)
  const isInactive = (client: Client) => {
    if (!client.ultimaVisita) return true
    const lastVisit = new Date(client.ultimaVisita)
    const daysSinceVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceVisit >= 60
  }

  const filteredClients = clientes.filter(client => {
    const matchesSearch = client.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    switch (filterType) {
      case 'frecuentes':
        return client.esClienteFrecuente
      case 'nuevos':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(client.fechaRegistro) >= thirtyDaysAgo
      case 'inactivos':
        return isInactive(client)
      default:
        return true
    }
  })

  const totalClients = clientes.length
  const frequentClients = clientes.filter(c => c.esClienteFrecuente).length
  const newClientsMonth = clientes.filter(c => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(c.fechaRegistro) >= thirtyDaysAgo
  }).length
  const inactiveClients = clientes.filter(c => isInactive(c)).length

  return (
    <>
      <AdminHeader 
        title="Clientes" 
        description="Gestiona la base de clientes"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Cliente</DialogTitle>
                <DialogDescription>
                  Completa los datos del nuevo cliente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" placeholder="Ej: Juan Perez" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input id="email" type="email" placeholder="juan@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input id="telefono" placeholder="+54 11 1234-5678" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Input id="notas" placeholder="Preferencias, observaciones..." />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilterType('all')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clientes
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilterType('frecuentes')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Frecuentes
              </CardTitle>
              <Star className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{frequentClients}</div>
              <p className="text-xs text-muted-foreground">mas de 10 turnos</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilterType('nuevos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nuevos (30 dias)
              </CardTitle>
              <UserPlus className="size-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newClientsMonth}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setFilterType('inactivos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactivos
              </CardTitle>
              <UserX className="size-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveClients}</div>
              <p className="text-xs text-muted-foreground">60+ dias sin visita</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="frecuentes">Frecuentes</SelectItem>
              <SelectItem value="nuevos">Nuevos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden sm:table-cell">Turnos</TableHead>
                  <TableHead className="hidden lg:table-cell">Ultima Visita</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(client.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.nombre}</p>
                          {client.notas && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {client.notas}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <p>{client.email}</p>
                        <p className="text-muted-foreground">{client.telefono}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{client.turnosTotales}</span>
                        {client.esClienteFrecuente && (
                          <Star className="size-3 fill-primary text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(client.ultimaVisita)}
                    </TableCell>
                    <TableCell>
                      {isInactive(client) ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          Inactivo
                        </Badge>
                      ) : client.esClienteFrecuente ? (
                        <Badge variant="default">Frecuente</Badge>
                      ) : (
                        <Badge variant="secondary">Regular</Badge>
                      )}
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
                            Ver historial
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 size-4" />
                            Agendar turno
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="mr-2 size-4" />
                            Enviar email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageCircle className="mr-2 size-4" />
                            Enviar WhatsApp
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
