'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Receipt, TrendingDown, Home, Zap, Users, Wrench, Package, FileText, MoreHorizontal, Pencil, Trash2, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

type Categoria = 'impuestos' | 'servicios' | 'alquiler' | 'sueldos' | 'insumos' | 'mantenimiento' | 'otros' | 'retiro_caja'

type Gasto = {
  idgasto: number
  descripcion: string
  monto: number
  categoria_gasto: Categoria
  fecha_gasto: string
  idusuario_barbero?: number | null
  barbero?: { persona: { nombre_completo: string } } | null
}

type Barbero = {
  idusuario: number
  persona: { nombre_completo: string }
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
  retiro_caja:  Banknote,
}

const categoryColors: Record<Categoria, string> = {
  impuestos:    'text-blue-400 bg-blue-400/10',
  servicios:    'text-yellow-400 bg-yellow-400/10',
  alquiler:     'text-purple-400 bg-purple-400/10',
  sueldos:      'text-green-400 bg-green-400/10',
  insumos:      'text-orange-400 bg-orange-400/10',
  mantenimiento: 'text-red-400 bg-red-400/10',
  otros:        'text-gray-400 bg-gray-400/10',
  retiro_caja:  'text-pink-400 bg-pink-400/10',
}

const FORM_GASTO_VACIO = { descripcion: '', categoria_gasto: '' as Categoria | '', monto: '', fecha_gasto: new Date().toISOString().split('T')[0] }
const FORM_RETIRO_VACIO = { idusuario_barbero: '', monto: '', descripcion: '', fecha_gasto: new Date().toISOString().split('T')[0] }

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

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
const fmtFecha = (f: string) => new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [modalGasto, setModalGasto] = useState(false)
  const [editandoGasto, setEditandoGasto] = useState<Gasto | null>(null)
  const [formGasto, setFormGasto] = useState({ ...FORM_GASTO_VACIO })

  const [modalRetiro, setModalRetiro] = useState(false)
  const [editandoRetiro, setEditandoRetiro] = useState<Gasto | null>(null)
  const [formRetiro, setFormRetiro] = useState({ ...FORM_RETIRO_VACIO })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { desde, hasta } = getRango(periodo)
    try { setGastos(await api.get<Gasto[]>(`/gastos?desde=${desde}&hasta=${hasta}`)) }
    catch { setGastos([]) }
  }

  useEffect(() => { cargar() }, [periodo])
  useEffect(() => {
    api.get<Barbero[]>('/barberos').then(setBarberos).catch(() => setBarberos([]))
  }, [])

  // --- Gastos normales ---
  const abrirNuevoGasto = () => {
    setEditandoGasto(null)
    setFormGasto({ ...FORM_GASTO_VACIO, fecha_gasto: new Date().toISOString().split('T')[0] })
    setError('')
    setModalGasto(true)
  }
  const abrirEditarGasto = (g: Gasto) => {
    setEditandoGasto(g)
    setFormGasto({ descripcion: g.descripcion, categoria_gasto: g.categoria_gasto, monto: String(g.monto), fecha_gasto: g.fecha_gasto })
    setError('')
    setModalGasto(true)
  }
  const guardarGasto = async () => {
    if (!formGasto.descripcion || !formGasto.categoria_gasto || !formGasto.monto || !formGasto.fecha_gasto)
      return setError('Completá todos los campos.')
    setGuardando(true); setError('')
    try {
      const payload = { descripcion: formGasto.descripcion, categoria_gasto: formGasto.categoria_gasto, monto: Number(formGasto.monto), fecha_gasto: formGasto.fecha_gasto }
      if (editandoGasto) await api.put(`/gastos/${editandoGasto.idgasto}`, payload)
      else await api.post('/gastos', payload)
      setModalGasto(false); cargar()
    } catch { setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  // --- Retiros de caja ---
  const abrirNuevoRetiro = () => {
    setEditandoRetiro(null)
    setFormRetiro({ ...FORM_RETIRO_VACIO, fecha_gasto: new Date().toISOString().split('T')[0] })
    setError('')
    setModalRetiro(true)
  }
  const abrirEditarRetiro = (g: Gasto) => {
    setEditandoRetiro(g)
    setFormRetiro({
      idusuario_barbero: g.idusuario_barbero ? String(g.idusuario_barbero) : '',
      monto: String(g.monto),
      descripcion: g.descripcion,
      fecha_gasto: g.fecha_gasto
    })
    setError('')
    setModalRetiro(true)
  }
  const guardarRetiro = async () => {
    if (!formRetiro.idusuario_barbero || !formRetiro.monto || !formRetiro.fecha_gasto)
      return setError('Seleccioná el barbero, monto y fecha.')
    setGuardando(true); setError('')
    try {
      const barbero = barberos.find(b => b.idusuario === Number(formRetiro.idusuario_barbero))
      const descripcion = formRetiro.descripcion.trim() || `Retiro de caja — ${barbero?.persona.nombre_completo ?? 'Barbero'}`
      const payload = {
        descripcion,
        categoria_gasto: 'retiro_caja',
        monto: Number(formRetiro.monto),
        fecha_gasto: formRetiro.fecha_gasto,
        idusuario_barbero: Number(formRetiro.idusuario_barbero)
      }
      if (editandoRetiro) await api.put(`/gastos/${editandoRetiro.idgasto}`, payload)
      else await api.post('/gastos', payload)
      setModalRetiro(false); cargar()
    } catch { setError('Error al guardar.') }
    finally { setGuardando(false) }
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return
    try { await api.delete(`/gastos/${id}`); cargar() } catch {}
  }

  const gastosNormales = gastos.filter(g => g.categoria_gasto !== 'retiro_caja')
  const retiros = gastos.filter(g => g.categoria_gasto === 'retiro_caja')

  const filtradosNormales = gastosNormales.filter(g => {
    const matchSearch = g.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'all' || g.categoria_gasto === categoryFilter
    return matchSearch && matchCat
  })

  const totalGastos = gastosNormales.reduce((acc, g) => acc + Number(g.monto), 0)
  const totalRetiros = retiros.reduce((acc, g) => acc + Number(g.monto), 0)

  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: gastosNormales.filter(g => g.categoria_gasto === cat.value).reduce((acc, g) => acc + Number(g.monto), 0),
  }))

  return (
    <>
      <AdminHeader title="Gastos" description="Registro de gastos y retiros del negocio" />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        <Tabs defaultValue="gastos">
          <TabsList>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
            <TabsTrigger value="retiros">Retiros de Caja</TabsTrigger>
          </TabsList>

          {/* ── TAB GASTOS ── */}
          <TabsContent value="gastos" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1">
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
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative max-w-sm">
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
                    <SelectItem value="all">Todas</SelectItem>
                    {CATEGORIAS.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2" onClick={abrirNuevoGasto}>
                <Plus className="size-4" /><span className="hidden sm:inline">Nuevo Gasto</span>
              </Button>
            </div>

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
                    {filtradosNormales.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay gastos registrados</TableCell></TableRow>
                    ) : filtradosNormales.map(g => {
                      const Icon = categoryIcons[g.categoria_gasto]
                      const catLabel = CATEGORIAS.find(c => c.value === g.categoria_gasto)?.label
                      return (
                        <TableRow key={g.idgasto}>
                          <TableCell className="text-muted-foreground">{fmtFecha(g.fecha_gasto)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn('rounded-lg p-2', categoryColors[g.categoria_gasto])}><Icon className="size-4" /></div>
                              <span className="font-medium">{g.descripcion}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell"><Badge variant="outline">{catLabel}</Badge></TableCell>
                          <TableCell className="text-right font-semibold text-destructive">-{fmt(Number(g.monto))}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => abrirEditarGasto(g)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => eliminar(g.idgasto)}><Trash2 className="mr-2 size-4" />Eliminar</DropdownMenuItem>
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
          </TabsContent>

          {/* ── TAB RETIROS DE CAJA ── */}
          <TabsContent value="retiros" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Retirado</CardTitle>
                    <Banknote className="size-4 text-pink-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-pink-400">{fmt(totalRetiros)}</div>
                    <p className="text-xs text-muted-foreground">{{ hoy: 'hoy', semana: 'esta semana', mes: 'este mes', anio: 'este año' }[periodo]}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cantidad de retiros</CardTitle>
                    <Users className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{retiros.length}</div>
                    <p className="text-xs text-muted-foreground">registros</p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={periodo} onValueChange={v => setPeriodo(v as Periodo)}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mes</SelectItem>
                    <SelectItem value="anio">Este año</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-2" onClick={abrirNuevoRetiro}>
                  <Plus className="size-4" /><span className="hidden sm:inline">Registrar Retiro</span>
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Barbero</TableHead>
                      <TableHead className="hidden sm:table-cell">Nota</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retiros.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No hay retiros registrados</TableCell></TableRow>
                    ) : retiros.map(g => {
                      const nombreBarbero = g.barbero?.persona?.nombre_completo
                        ?? barberos.find(b => b.idusuario === g.idusuario_barbero)?.persona.nombre_completo
                        ?? '—'
                      return (
                        <TableRow key={g.idgasto}>
                          <TableCell className="text-muted-foreground">{fmtFecha(g.fecha_gasto)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg p-2 text-pink-400 bg-pink-400/10"><Banknote className="size-4" /></div>
                              <span className="font-medium">{nombreBarbero}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{g.descripcion}</TableCell>
                          <TableCell className="text-right font-semibold text-pink-400">-{fmt(Number(g.monto))}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => abrirEditarRetiro(g)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => eliminar(g.idgasto)}><Trash2 className="mr-2 size-4" />Eliminar</DropdownMenuItem>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal gasto */}
      <Dialog open={modalGasto} onOpenChange={setModalGasto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoGasto ? 'Editar Gasto' : 'Registrar Gasto'}</DialogTitle>
            <DialogDescription>{editandoGasto ? 'Modificá los datos del gasto' : 'Registrá un nuevo gasto del negocio'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Describe el gasto..." rows={2} value={formGasto.descripcion} onChange={e => setFormGasto(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={formGasto.categoria_gasto} onValueChange={v => setFormGasto(p => ({ ...p, categoria_gasto: v as Categoria }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monto ($)</Label>
                <Input type="number" placeholder="0" value={formGasto.monto} onChange={e => setFormGasto(p => ({ ...p, monto: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Input type="date" value={formGasto.fecha_gasto} onChange={e => setFormGasto(p => ({ ...p, fecha_gasto: e.target.value }))} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalGasto(false)}>Cancelar</Button>
            <Button onClick={guardarGasto} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal retiro */}
      <Dialog open={modalRetiro} onOpenChange={setModalRetiro}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoRetiro ? 'Editar Retiro' : 'Registrar Retiro de Caja'}</DialogTitle>
            <DialogDescription>Anotá quién retiró dinero de la caja y cuánto</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Barbero</Label>
              <Select value={formRetiro.idusuario_barbero} onValueChange={v => setFormRetiro(p => ({ ...p, idusuario_barbero: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar barbero" /></SelectTrigger>
                <SelectContent>
                  {barberos.map(b => (
                    <SelectItem key={b.idusuario} value={String(b.idusuario)}>{b.persona.nombre_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Monto ($)</Label>
                <Input type="number" placeholder="0" value={formRetiro.monto} onChange={e => setFormRetiro(p => ({ ...p, monto: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <Input type="date" value={formRetiro.fecha_gasto} onChange={e => setFormRetiro(p => ({ ...p, fecha_gasto: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nota <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="Motivo del retiro..." value={formRetiro.descripcion} onChange={e => setFormRetiro(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRetiro(false)}>Cancelar</Button>
            <Button onClick={guardarRetiro} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
