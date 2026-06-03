'use client'

import { useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Receipt,
  TrendingDown,
  Home,
  Zap,
  Users,
  Wrench,
  Package,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { gastos, categoriasGastos } from '@/lib/mock-data'
import { ExpenseCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

const categoryIcons: Record<ExpenseCategory, React.ElementType> = {
  impuestos: FileText,
  servicios: Zap,
  alquiler: Home,
  sueldos: Users,
  insumos: Package,
  mantenimiento: Wrench,
  otros: Receipt,
}

const categoryColors: Record<ExpenseCategory, string> = {
  impuestos: 'text-blue-400 bg-blue-400/10',
  servicios: 'text-yellow-400 bg-yellow-400/10',
  alquiler: 'text-purple-400 bg-purple-400/10',
  sueldos: 'text-green-400 bg-green-400/10',
  insumos: 'text-orange-400 bg-orange-400/10',
  mantenimiento: 'text-red-400 bg-red-400/10',
  otros: 'text-gray-400 bg-gray-400/10',
}

export default function GastosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredExpenses = gastos.filter(expense => {
    const matchesSearch = expense.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.categoria === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate stats by category
  const expensesByCategory = categoriasGastos.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.value).reduce((acc, g) => acc + g.monto, 0)
  }))

  const totalExpenses = gastos.reduce((acc, g) => acc + g.monto, 0)

  return (
    <>
      <AdminHeader 
        title="Gastos" 
        description="Registro de gastos del negocio"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nuevo Gasto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Gasto</DialogTitle>
                <DialogDescription>
                  Registra un nuevo gasto del negocio
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Descripcion</Label>
                  <Textarea 
                    placeholder="Describe el gasto..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasGastos.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Monto ($)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input type="date" />
                  </div>
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
        {/* Total and Category Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Gastos
              </CardTitle>
              <TrendingDown className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">este periodo</p>
            </CardContent>
          </Card>
          
          {expensesByCategory.filter(c => c.total > 0).slice(0, 3).map(cat => {
            const Icon = categoryIcons[cat.value as ExpenseCategory]
            return (
              <Card key={cat.value}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {cat.label}
                  </CardTitle>
                  <div className={cn('rounded-lg p-2', categoryColors[cat.value as ExpenseCategory])}>
                    <Icon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(cat.total)}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar gasto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categoriasGastos.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map(expense => {
                  const Icon = categoryIcons[expense.categoria]
                  const categoryLabel = categoriasGastos.find(c => c.value === expense.categoria)?.label
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(expense.fecha)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn('rounded-lg p-2', categoryColors[expense.categoria])}>
                            <Icon className="size-4" />
                          </div>
                          <span className="font-medium">{expense.descripcion}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{categoryLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -{formatCurrency(expense.monto)}
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
                              <Pencil className="mr-2 size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
