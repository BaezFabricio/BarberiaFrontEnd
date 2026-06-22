'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MoreHorizontal, Pencil, Users, UserPlus, Star } from 'lucide-react'
import { api } from '@/lib/api'

type Cliente = {
  idcliente: number
  notas_cliente: string | null
  estado: string
  createdAt: string
  persona: { nombre_completo: string; telefono: string; correo_electronico: string | null; fecha_registro: string }
}


export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'all' | 'nuevos'>('all')

  const cargar = async () => {
    try {
      const data = await api.get<Cliente[]>('/clientes')
      setClientes(data)
    } catch { setClientes([]) }
  }

  useEffect(() => { cargar() }, [])

  const treintaDiasAtras = new Date()
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30)

  const filtrados = clientes.filter(c => {
    const matchBusqueda = c.persona.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.persona.correo_electronico ?? '').toLowerCase().includes(busqueda.toLowerCase())
    if (!matchBusqueda) return false
    if (filtro === 'nuevos') return new Date(c.persona.fecha_registro) >= treintaDiasAtras
    return true
  })

  const nuevos = clientes.filter(c => new Date(c.persona.fecha_registro) >= treintaDiasAtras).length
  const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  const formatFecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      <AdminHeader
        title="Clientes"
        description="Los clientes se registran automáticamente al sacar un turno"
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltro('all')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{clientes.length}</div></CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFiltro('nuevos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos (30 días)</CardTitle>
              <UserPlus className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{nuevos}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mostrando</CardTitle>
              <Star className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{filtrados.length}</div></CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Select value={filtro} onValueChange={v => setFiltro(v as typeof filtro)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nuevos">Nuevos (30 días)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell">Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No hay clientes todavía
                    </TableCell>
                  </TableRow>
                ) : filtrados.map(c => (
                  <TableRow key={c.idcliente}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(c.persona.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{c.persona.nombre_completo}</p>
                          {c.notas_cliente && (
                            <p className="max-w-[150px] truncate text-xs text-muted-foreground">{c.notas_cliente}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <p>{c.persona.correo_electronico ?? '—'}</p>
                        <p className="text-muted-foreground">{c.persona.telefono}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatFecha(c.persona.fecha_registro)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.estado === 'activo' ? 'secondary' : 'outline'}>
                        {c.estado === 'activo' ? 'Regular' : 'Inactivo'}
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
                          <DropdownMenuItem><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
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
