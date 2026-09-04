'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Package,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  User,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Store,
  Globe,
  Menu,
  Images
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { authApi, api } from '@/lib/api'
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'
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
      { title: 'Comisiones', href: '/admin/comisiones', icon: DollarSign },
      { title: 'Gastos', href: '/admin/gastos', icon: Receipt },
      { title: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
    ]
  },
  {
    title: 'Landing',
    items: [
      { title: 'Galería', href: '/admin/galeria', icon: Images },
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
  const [barberia, setBarberia] = useState<{ nombre_negocio: string; logo_url?: string; color_primario?: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    aplicarColorGuardado()
    api.get<{ nombre_negocio: string; logo_url?: string; color_primario?: string }>('/mi-barberia')
      .then(d => { setBarberia(d); if (d.color_primario) aplicarColor(d.color_primario, true) })
      .catch(() => {})
  }, [])

  const handleLogoChange = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('imagen', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mi-barberia/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const data = await res.json()
      if (res.ok) setBarberia(p => p ? { ...p, logo_url: data.logo_url } : p)
    } finally { setUploading(false) }
  }

  return (
    <div className="flex items-center gap-3 px-2 py-1 min-w-0 overflow-hidden">
      <button
        type="button"
        title="Cambiar logo"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-9 w-auto max-w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/30 px-1 transition-opacity hover:opacity-80"
      >
        {barberia?.logo_url ? (
          <img src={barberia.logo_url} alt={barberia.nombre_negocio} className="h-7 w-auto max-w-[40px] object-contain" />
        ) : (
          <Scissors className="size-5 text-primary" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
      </button>
      <Link href="/admin" className="flex flex-col min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-bold text-foreground truncate">{barberia?.nombre_negocio ?? 'Mi Barbería'}</span>
        <span className="text-xs text-muted-foreground truncate">Sistema de Gestión</span>
      </Link>
    </div>
  )
}

function NotificationBadge() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    api.get<{ leido: boolean }[]>('/notificaciones')
      .then(data => setCount(data.filter(n => !n.leido).length))
      .catch(() => {})
  }, [])
  if (count === 0) return null
  return (
    <Badge variant="destructive" className="ml-auto size-5 justify-center rounded-full p-0 text-xs">
      {count}
    </Badge>
  )
}

type PerfilAdmin = { nombre_completo: string; correo_electronico: string; foto_url?: string | null }

function getRol(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.rol ?? null
  } catch { return null }
}

function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [perfil, setPerfil] = useState<PerfilAdmin | null>(null)
  const [rol, setRol] = useState<string | null>(null)

  useEffect(() => {
    setRol(getRol())
    api.get<PerfilAdmin>('/mi-perfil')
      .then(d => setPerfil(d))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    authApi.logout()
    router.push('/login')
  }

  const initiales = perfil?.nombre_completo
    ? perfil.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ver sitio web" className="transition-colors">
                  <Link href="/">
                    <Globe className="size-4" />
                    <span>Ver sitio web</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
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
        {(rol === 'owner' || rol === 'admin') && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mi Panel
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Panel de barbero"
                    className="transition-colors"
                  >
                    <Link href="/barbero">
                      <Store className="size-4" />
                      <span>Panel de barbero</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="size-6">
                    {perfil?.foto_url && <AvatarImage src={perfil.foto_url} alt={perfil.nombre_completo} className="object-cover" />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initiales}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">{perfil?.nombre_completo ?? 'Administrador'}</span>
                    <span className="text-xs text-muted-foreground">{perfil?.correo_electronico ?? ''}</span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/perfil">
                    <User className="mr-2 size-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/configuracion">
                    <Settings className="mr-2 size-4" />
                    Configuracion
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
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
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 md:min-h-16">
      <SidebarTrigger className="shrink-0" />
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-foreground md:text-xl truncate">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate md:text-sm">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </div>
    </header>
  )
}

const bottomNavItems = [
  { title: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { title: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { title: 'Clientes', href: '/admin/clientes', icon: Users },
  { title: 'Barberos', href: '/admin/barberos', icon: Scissors },
]

function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {bottomNavItems.map(item => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className={cn('size-5', isActive && 'text-primary')} />
            <span>{item.title}</span>
          </Link>
        )
      })}
      <SidebarTrigger className="flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground h-auto rounded-none">
        <Menu className="size-5" />
        <span>Más</span>
      </SidebarTrigger>
    </nav>
  )
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={typeof window !== 'undefined' && window.innerWidth >= 768} style={{ overflow: 'hidden', maxWidth: '100vw' }}>
      <AdminRouteTransition />
      <AdminSidebar />
      <SidebarInset className="flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {children}
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  )
}
