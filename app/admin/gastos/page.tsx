'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Receipt, TrendingDown, Home, Zap, Users, Wrench, Package, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

type Categoria = 'impuestos' | 'servicios' | 'alquiler' | 'sueldos' | 'insumos' | 'mantenimiento' | 'otros'

type Gasto = {
  idgasto: number
  descripcion: string
  monto: number
  categoria_gasto: Categoria
  fecha_gasto: string
}

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'impuestos',     label: 'Impuestos' },
  { value: 'servicios',     label: 'Servicios' },
  { value: 'alquiler',      label: 'Alquiler' },
  { value: 'sueldos',       label: 'Sueldos' },
  { value: 'insumos',       label: 'Insumos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otros',         label: 'Otros' },
]

const categoryIcons: Record<Categoria, React.ElementType> = {
  impuestos:    FileText,
  servicios:    Zap,
  alquiler:     Home,
  sueldos:      Users,
  insumos:      Package,
  mantenimiento: Wrench,
  otros:        Receipt,
}

const categoryColors: Record<Categoria, string> = {
  impuestos:    'text-blue-400 bg-blue-400/10',
  servicios:    'text-yellow-400 bg-yellow-400/10',
  alquiler:     'text-purple-400 bg-purple-400/10',
  sueldos:      'text-green-400 bg-green-400/10',
  insumos:      'text-orange-400 bg-orange-400/10',
  mantenimiento: 'text-red-400 bg-red-400/10',
  otros:        'text-gray-400 bg-gray-400/10',
}

const FORM_VACIO = { descripcion: '', categoria_gasto: '' as Categoria | '', monto: '', fecha_gasto: new Date().toISOString().split('T')[0] }

type Periodo = 'hoy' | 'semana' | 'mes' | 'anio'

function getRango(periodo: Periodo): { desde: string; hasta: string } {
  const hoy = new Date()
  const hasta = hoy.toISOString().split('T')[0]
  if (periodo === 'hoy') return { desde: hasta, hasta }
  if (periodo === 'semana') {
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
    return { desde: lunes.toISOString().split('T')[0], hasta }
  }
  if (periodo === 'mes') return { desde: hasta.slice(0, 8) + '01', hasta }
  return { desde: `${hoy.getFullYear()}-01-01`, hasta }
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Gasto | null>(null)
  const [form, setForm] = useState({ ...FORM_VACIO })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { desde, hasta } = getRango(periodo)
    try { setGastos(await api.get<Gasto[]>(`/gastos?desde=${desde}&hasta=${hasta}`)) }
    catch { setGastos([]) }
  }

  useEffect(() => { cargar() }, [periodo])

  const abrirEditar = (g: Gasto) => {
    setEditando(g)
    setForm({ descripcion: g.descripcion, categoria_gasto: g.categoria_gasto, monto: String(g.monto), fecha_gasto: g.fecha_gasto })
    setError('')
    setIsCreateDialogOpen(true)
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ ...FORM_VACIO, fecha_gasto: new Date().toISOString().split('T')[0] })
    setError('')
    setIsCreateDialogOpen(true)
  }

  const guardar = async () => {
    if (!form.descripcion || !form.categoria_gasto || !form.monto || !form.fecha_gasto)
      return setError('Completá todos los campos.')
    setGuardando(true); setError('')
    try {
      const payload = { descripcion: form.descripcion, categoria_gasto: form.categoria_gasto, monto: Number(form.monto), fecha_gasto: form.fecha_gasto }
      if (editando) await api.put(`/gastos/${editando.idgasto}`, payload)
      else await api.post('/gastos', payload)
      setIsCreateDialogOpen(false)
      cargar()
    } catch { setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try { await api.delete(`/gastos/${id}`); cargar() } catch {}
  }

  const filtrados = gastos.filter(g => {
    const matchSearch = g.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'all' || g.categoria_gasto === categoryFilter
    return matchSearch && matchCat
  })

  const totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0)

  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria_gasto === cat.value).reduce((acc, g) => acc + Number(g.monto), 0),
  }))

  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
  const fmtFecha = (f: string) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      <AdminHeader
        title="Gastos"
        description="Registro de gastos del negocio"
        actions={
          <Button className="gap-2" onClick={abrirNuevo}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo Gasto</span>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gastos</CardTitle>
              <TrendingDown className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{fmt(totalGastos)}</div>
              <p className="text-xs text-muted-foreground">{{ hoy: 'hoy', semana: 'esta semana', mes: 'este mes', anio: 'este año' }[periodo]}</p>
            </CardContent>
          </Card>
          {porCategoria.filter(c => c.total > 0).slice(0, 3).map(cat => {
            const Icon = categoryIcons[cat.value]
            return (
              <Card key={cat.value}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{cat.label}</CardTitle>
                  <div className={cn('rounded-lg p-2', categoryColors[cat.value])}>
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fmt(cat.total)}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar gasto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="anio">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIAS.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No hay gastos registrados
                    </TableCell>
                  </TableRow>
                ) : filtrados.map(g => {
                  const Icon = categoryIcons[g.categoria_gasto]
                  const catLabel = CATEGORIAS.find(c => c.value === g.categoria_gasto)?.label
                  return (
                    <TableRow key={g.idgasto}>
                      <TableCell className="text-muted-foreground">{fmtFecha(g.fecha_gasto)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn('rounded-lg p-2', categoryColors[g.categoria_gasto])}>
                            <Icon className="size-4" />
                          </div>
                          <span className="font-medium">{g.descripcion}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{catLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -{fmt(Number(g.monto))}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirEditar(g)}>
                              <Pencil className="mr-2 size-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => eliminar(g.idgasto)}>
                              <Trash2 className="mr-2 size-4" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>

      {/* Modal crear/editar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Gasto' : 'Registrar Gasto'}</DialogTitle>
            <DialogDescription>{editando ? 'Modificá los datos del gasto' : 'Registrá un nuevo gasto del negocio'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Describe el gasto..." rows={2} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={form.categoria_gasto} onValueChange={v => setForm(p => ({ ...p, categoria_gasto: v as Categoria }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monto ($)</Label>
                <Input type="number" placeholder="0" value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha_gasto} onChange={e => setForm(p => ({ ...p, fecha_gasto: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
