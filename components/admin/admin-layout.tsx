'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Package,
  DollarSign,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  User,
  ShoppingBag,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { notificaciones } from '@/lib/mock-data'
import { ThemeToggle } from '@/components/theme-toggle'
import { AdminRouteTransition } from '@/components/admin/admin-route-transition'

const menuItems = [
  {
    title: 'Principal',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { title: 'Agenda', href: '/admin/agenda', icon: Calendar },
    ]
  },
  {
    title: 'Gestion',
    items: [
      { title: 'Barberos', href: '/admin/barberos', icon: Scissors },
      { title: 'Clientes', href: '/admin/clientes', icon: Users },
      { title: 'Servicios', href: '/admin/servicios', icon: Package },
      { title: 'Productos', href: '/admin/productos', icon: ShoppingBag },
    ]
  },
  {
    title: 'Finanzas',
    items: [
      { title: 'Pagos y Ventas', href: '/admin/pagos', icon: CreditCard },
      { title: 'Gastos', href: '/admin/gastos', icon: Receipt },
      { title: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { title: 'Notificaciones', href: '/admin/notificaciones', icon: Bell },
      { title: 'Configuracion', href: '/admin/configuracion', icon: Settings },
    ]
  }
]

function Logo() {
  const [logoAvailable, setLogoAvailable] = useState(true)

  return (
    <Link href="/admin" className="flex items-center gap-3 px-2 py-1">
      <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-transparent">
        {logoAvailable ? (
          <img
            src="/logo.png"
            alt="Barber Studio"
            className="size-9 object-contain"
            onError={() => setLogoAvailable(false)}
          />
        ) : (
          <Scissors className="size-5 text-primary" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground">Barber Studio</span>
        <span className="text-xs text-muted-foreground">Sistema de Gestion</span>
      </div>
    </Link>
  )
}

function NotificationBadge() {
  const unreadCount = notificaciones.filter(n => !n.leida).length
  if (unreadCount === 0) return null
  return (
    <Badge variant="destructive" className="ml-auto size-5 justify-center rounded-full p-0 text-xs">
      {unreadCount}
    </Badge>
  )
}

function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          'transition-colors',
                          isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn('size-4', isActive && 'text-primary')} />
                          <span>{item.title}</span>
                          {item.title === 'Notificaciones' && <NotificationBadge />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">Administrador</span>
                    <span className="text-xs text-muted-foreground">admin@barberstudio.com</span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 size-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Configuracion
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

interface AdminHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminRouteTransition />
      <AdminSidebar />
      <SidebarInset className="flex flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
