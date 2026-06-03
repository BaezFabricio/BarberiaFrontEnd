'use client'

import { AlertTriangle, Package, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LowStockAlertProps {
  products: Product[]
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  const lowStockProducts = products.filter(p => p.stock <= p.stockMinimo && p.activo)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (lowStockProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="size-5" />
            Stock de Productos
          </CardTitle>
          <CardDescription>Estado del inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 rounded-full bg-success/10 p-3">
              <Package className="size-6 text-success" />
            </div>
            <p className="font-medium text-foreground">Stock en orden</p>
            <p className="text-sm text-muted-foreground">
              Todos los productos tienen stock suficiente
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-warning/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="size-5 text-warning" />
          Alerta de Stock
        </CardTitle>
        <CardDescription>
          {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            className={cn(
              'flex items-center justify-between rounded-lg border p-3',
              product.stock <= 1 ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-lg p-2',
                product.stock <= 1 ? 'bg-destructive/10' : 'bg-warning/10'
              )}>
                <ShoppingBag className={cn(
                  'size-4',
                  product.stock <= 1 ? 'text-destructive' : 'text-warning'
                )} />
              </div>
              <div>
                <p className="font-medium text-foreground">{product.nombre}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(product.precio)}</p>
              </div>
            </div>
            <Badge variant={product.stock <= 1 ? 'destructive' : 'outline'}>
              {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
            </Badge>
          </div>
        ))}
        <Button variant="outline" className="w-full" asChild>
          <a href="/admin/productos">Ver todos los productos</a>
        </Button>
      </CardContent>
    </Card>
  )
}
