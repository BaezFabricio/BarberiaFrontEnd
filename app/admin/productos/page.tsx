'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, MoreHorizontal, Pencil, Package, AlertTriangle, DollarSign, ShoppingBag, Minus, PlusIcon, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

type Producto = {
  idproducto: number
  nombre_producto: string
  descripcion: string | null
  categoria: string
  precio_venta: number
  stock_actual: number
  stock_minimo: number
}

const FORM_VACIO = { nombre_producto: '', descripcion: '', categoria: '', precio_venta: '', stock_actual: '0', stock_minimo: '5' }
const CATEGORIAS_DEFAULT = ['Fijadores', 'Cuidado capilar', 'Barba', 'Herramientas', 'Otros']

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('all')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState<Producto | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const cargar = async () => {
    try {
      const data = await api.get<Producto[]>('/productos')
      setProductos(data)
    } catch { setProductos([]) }
  }

  useEffect(() => { cargar() }, [])

  const abrirCrear = () => { setEditando(null); setForm(FORM_VACIO); setError(''); setModalAbierto(true) }
  const abrirEditar = (p: Producto) => {
    setEditando(p)
    setForm({ nombre_producto: p.nombre_producto, descripcion: p.descripcion ?? '', categoria: p.categoria,
      precio_venta: String(p.precio_venta), stock_actual: String(p.stock_actual), stock_minimo: String(p.stock_minimo) })
    setError(''); setModalAbierto(true)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nombre_producto || !form.categoria || !form.precio_venta) return setError('Nombre, categoría y precio son obligatorios.')
    setLoading(true)
    try {
      const payload = { ...form, precio_venta: Number(form.precio_venta), stock_actual: Number(form.stock_actual), stock_minimo: Number(form.stock_minimo) }
      if (editando) await api.put(`/productos/${editando.idproducto}`, payload)
      else await api.post('/productos', payload)
      setModalAbierto(false)
      cargar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally { setLoading(false) }
  }

  const confirmarYEliminar = async () => {
    if (!confirmarEliminar) return
    setEliminando(true); setErrorEliminar('')
    try {
      await api.delete(`/productos/${confirmarEliminar.idproducto}`)
      setConfirmarEliminar(null)
      cargar()
    } catch (err: unknown) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error al eliminar.')
    } finally { setEliminando(false) }
  }

  const ajustarStock = async (p: Producto, delta: number) => {
    const nuevo = Math.max(0, p.stock_actual + delta)
    await api.put(`/productos/${p.idproducto}`, { stock_actual: nuevo })
    cargar()
  }

  const categorias = [...new Set(productos.map(p => p.categoria))]
  const filtrados = productos.filter(p => {
    const matchBusqueda = p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = categoriaFiltro === 'all' || p.categoria === categoriaFiltro
    return matchBusqueda && matchCat
  })

  const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length
  const valorInventario = productos.reduce((a, p) => a + Number(p.precio_venta) * p.stock_actual, 0)
  const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

  const getStockStatus = (p: Producto) => {
    if (p.stock_actual === 0) return { label: 'Sin stock', variant: 'destructive' as const, className: '' }
    if (p.stock_actual <= p.stock_minimo) return { label: 'Stock bajo', variant: 'outline' as const, className: 'text-warning border-warning' }
    return { label: 'En stock', variant: 'secondary' as const, className: '' }
  }

  return (
    <>
      <AdminHeader
        title="Productos"
        description="Gestiona el inventario de productos"
        actions={
          <Button className="gap-2" onClick={abrirCrear}>
            <Plus className="size-4" /><span className="hidden sm:inline">Nuevo Producto</span>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Productos</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{productos.length}</div></CardContent>
          </Card>
          <Card className={stockBajo > 0 ? 'border-warning/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock Bajo</CardTitle>
              <AlertTriangle className={cn('size-4', stockBajo > 0 ? 'text-warning' : 'text-muted-foreground')} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockBajo}</div>
              <p className="text-xs text-muted-foreground">productos a reponer</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor del Inventario</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{fmt(valorInventario)}</div></CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No hay productos todavía
                    </TableCell>
                  </TableRow>
                ) : filtrados.map(p => {
                  const status = getStockStatus(p)
                  return (
                    <TableRow key={p.idproducto}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                            <ShoppingBag className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{p.nombre_producto}</p>
                            {p.descripcion && <p className="max-w-[200px] truncate text-xs text-muted-foreground">{p.descripcion}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{p.categoria}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{fmt(Number(p.precio_venta))}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => ajustarStock(p, -1)} disabled={p.stock_actual === 0}>
                            <Minus className="size-3" />
                          </Button>
                          <span className={cn('min-w-[2rem] text-center font-medium', p.stock_actual <= p.stock_minimo && 'text-warning')}>
                            {p.stock_actual}
                          </span>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => ajustarStock(p, 1)}>
                            <PlusIcon className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirEditar(p)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setErrorEliminar(''); setConfirmarEliminar(p) }}>
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

      {/* Modal confirmar eliminación */}
      <Dialog open={!!confirmarEliminar} onOpenChange={v => { if (!v) { setConfirmarEliminar(null); setErrorEliminar('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>Esta acción es permanente y no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <span className="font-semibold text-foreground">{confirmarEliminar?.nombre_producto}</span>?
          </p>
          {errorEliminar && <p className="text-sm text-destructive">{errorEliminar}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConfirmarEliminar(null); setErrorEliminar('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarYEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal crear/editar */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar producto' : 'Agregar Producto'}</DialogTitle>
            <DialogDescription>Registra un nuevo producto en el inventario</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre del producto *</Label>
              <Input placeholder="Ej: Pomada Fijacion Fuerte" value={form.nombre_producto}
                onChange={e => setForm(p => ({ ...p, nombre_producto: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Describe el producto..." rows={2} value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Categoría *</Label>
              <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {[...new Set([...categorias, ...CATEGORIAS_DEFAULT])].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Precio ($) *</Label>
                <Input type="number" min="0" placeholder="2800" value={form.precio_venta}
                  onChange={e => setForm(p => ({ ...p, precio_venta: e.target.value }))} required />
              </div>
              <div className="grid gap-2">
                <Label>Stock</Label>
                <Input type="number" min="0" placeholder="10" value={form.stock_actual}
                  onChange={e => setForm(p => ({ ...p, stock_actual: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Stock mín.</Label>
                <Input type="number" min="0" placeholder="5" value={form.stock_minimo}
                  onChange={e => setForm(p => ({ ...p, stock_minimo: e.target.value }))} />
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
