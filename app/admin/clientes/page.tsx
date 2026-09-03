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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, MoreHorizontal, History, Users, UserPlus, Star, Calendar, Clock, Scissors, UserX, Send, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'

type Cliente = {
  idcliente: number
  notas_cliente: string | null
  estado: string
  createdAt: string
  total_turnos: number
  persona: { nombre_completo: string; telefono: string; correo_electronico: string | null; fecha_registro: string }
}

function clasificarCliente(total: number): { label: string; variant: 'secondary' | 'default' } {
  if (total >= 5) return { label: 'Frecuente', variant: 'default' }
  return { label: 'Regular', variant: 'secondary' }
}

type Turno = {
  idagenda: number
  fecha: string
  hora_inicio: string
  estado: string
  servicio: { nombre_servicio: string; precio: number }
  barbero: { persona: { nombre_completo: string } }
}

type Inactivo = {
  idcliente: number
  ultima_visita: string | null
  dias_inactivo: number | null
  persona: { nombre_completo: string; telefono: string; correo_electronico: string | null }
}

export default function ClientesPage() {
  const [tab, setTab] = useState<'todos' | 'inactivos'>('todos')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'all' | 'nuevos'>('all')
  const [clienteHistorial, setClienteHistorial] = useState<Cliente | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(false)

  // Inactivos
  const [inactivos, setInactivos] = useState<Inactivo[]>([])
  const [diasConfig, setDiasConfig] = useState(60)
  const [loadingInactivos, setLoadingInactivos] = useState(false)
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [modalPromo, setModalPromo] = useState(false)
  const [mensajePromo, setMensajePromo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultadoEnvio, setResultadoEnvio] = useState<string | null>(null)

  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null)
  const [formEditar, setFormEditar] = useState({ nombre_completo: '', telefono: '', correo_electronico: '', notas_cliente: '' })
  const [guardandoEditar, setGuardandoEditar] = useState(false)

  const cargar = async () => {
    try { setClientes(await api.get<Cliente[]>('/clientes')) }
    catch { setClientes([]) }
  }

  const abrirEditar = (c: Cliente) => {
    setClienteEditar(c)
    setFormEditar({
      nombre_completo: c.persona.nombre_completo,
      telefono: c.persona.telefono,
      correo_electronico: c.persona.correo_electronico ?? '',
      notas_cliente: c.notas_cliente ?? '',
    })
  }

  const guardarEditar = async () => {
    if (!clienteEditar) return
    setGuardandoEditar(true)
    try {
      await api.put(`/clientes/${clienteEditar.idcliente}`, formEditar)
      setClienteEditar(null)
      cargar()
    } catch { } finally { setGuardandoEditar(false) }
  }

  const eliminarCliente = async (c: Cliente) => {
    if (!confirm(`¿Eliminar a ${c.persona.nombre_completo}?`)) return
    await api.delete(`/clientes/${c.idcliente}`)
    cargar()
  }

  const cargarInactivos = async () => {
    setLoadingInactivos(true)
    try {
      const data = await api.get<{ dias_config: number; inactivos: Inactivo[] }>('/clientes/inactivos')
      setInactivos(data.inactivos)
      setDiasConfig(data.dias_config)
    } catch { setInactivos([]) }
    finally { setLoadingInactivos(false) }
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { if (tab === 'inactivos') cargarInactivos() }, [tab])

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

  const abrirHistorial = async (c: Cliente) => {
    setClienteHistorial(c); setTurnos([]); setLoadingTurnos(true)
    try { setTurnos(await api.get<Turno[]>(`/clientes/${c.idcliente}/turnos`)) }
    catch { setTurnos([]) }
    finally { setLoadingTurnos(false) }
  }

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleTodos = () => {
    setSeleccionados(prev => prev.length === inactivos.length ? [] : inactivos.map(i => i.idcliente))
  }

  const enviarPromo = async () => {
    if (!mensajePromo.trim() || seleccionados.length === 0) return
    setEnviando(true)
    try {
      const r = await api.post<{ enviados: number; total: number }>('/clientes/enviar-promo', {
        ids: seleccionados,
        mensaje: mensajePromo,
      })
      setResultadoEnvio(`Enviado a ${r.enviados} de ${r.total} clientes`)
      setModalPromo(false)
      setMensajePromo('')
    } catch {
      setResultadoEnvio('Error al enviar. Verificá la configuración de notificaciones.')
    } finally { setEnviando(false) }
  }

  const estadoBadge = (e: string) => {
    const map: Record<string, string> = { pendiente: 'bg-yellow-500/10 text-yellow-500', confirmado: 'bg-blue-500/10 text-blue-500', atendido: 'bg-green-500/10 text-green-600', cobrado: 'bg-green-500/10 text-green-600', cancelado: 'bg-red-500/10 text-red-500', ausente: 'bg-orange-500/10 text-orange-500' }
    return map[e] ?? 'bg-muted text-muted-foreground'
  }

  const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  const formatFecha = (f: string | null) => {
    if (!f) return '—'
    const d = new Date(f)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <AdminHeader
        title="Clientes"
        description="Los clientes se registran automáticamente al sacar un turno"
      />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(['todos', 'inactivos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t === 'todos' ? 'Todos los clientes' : 'Clientes inactivos'}
            </button>
          ))}
        </div>

        {tab === 'todos' && (
          <>
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto"><Table>
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
                          {c.estado === 'activo' ? (
                            <Badge variant={clasificarCliente(c.total_turnos).variant}>
                              {clasificarCliente(c.total_turnos).label}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inactivo</Badge>
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
                              <DropdownMenuItem onClick={() => abrirHistorial(c)}><History className="mr-2 size-4" />Ver historial</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => abrirEditar(c)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => eliminarCliente(c)}><Trash2 className="mr-2 size-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'inactivos' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Clientes sin visita en los últimos <span className="font-medium text-foreground">{diasConfig} días</span>.
                Podés enviarles una promo para recuperarlos.
              </p>
              <Button disabled={seleccionados.length === 0} onClick={() => { setModalPromo(true); setResultadoEnvio(null) }} className="gap-2">
                <Send className="size-4" />
                Enviar promo ({seleccionados.length})
              </Button>
            </div>

            {resultadoEnvio && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                {resultadoEnvio}
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={inactivos.length > 0 && seleccionados.length === inactivos.length}
                          onCheckedChange={toggleTodos} />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Contacto</TableHead>
                      <TableHead>Última visita</TableHead>
                      <TableHead>Días sin venir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInactivos ? (
                      <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
                    ) : inactivos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          <UserX className="mx-auto mb-2 size-8 opacity-30" />
                          No hay clientes inactivos
                        </TableCell>
                      </TableRow>
                    ) : inactivos.map(c => (
                      <TableRow key={c.idcliente}>
                        <TableCell>
                          <Checkbox checked={seleccionados.includes(c.idcliente)}
                            onCheckedChange={() => toggleSeleccion(c.idcliente)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                {getInitials(c.persona.nombre_completo)}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{c.persona.nombre_completo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <p>{c.persona.correo_electronico ?? '—'}</p>
                          <p className="text-muted-foreground">{c.persona.telefono}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFecha(c.ultima_visita)}
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(c.dias_inactivo ?? 999) > 90 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-600'}`}>
                            {c.dias_inactivo != null ? `${c.dias_inactivo} días` : 'Sin visitas'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal historial */}
      <Dialog open={!!clienteHistorial} onOpenChange={open => { if (!open) setClienteHistorial(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Historial de turnos</DialogTitle>
            <DialogDescription>{clienteHistorial?.persona.nombre_completo} · {clienteHistorial?.persona.telefono}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {loadingTurnos ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : turnos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Este cliente no tiene turnos registrados</p>
            ) : turnos.map(t => (
              <div key={t.idagenda} className="rounded-lg border border-border bg-muted/30 p-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scissors className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-sm">{t.servicio.nombre_servicio}</span>
                    <span className="text-xs text-muted-foreground">${t.servicio.precio}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3" />{formatFecha(t.fecha)}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" />{t.hora_inicio.slice(0, 5)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Barbero: {t.barbero?.persona?.nombre_completo ?? '—'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${estadoBadge(t.estado)}`}>{t.estado}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal promo */}
      <Dialog open={modalPromo} onOpenChange={setModalPromo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar promoción</DialogTitle>
            <DialogDescription>
              Se enviará por email a los {seleccionados.length} clientes seleccionados.
              Usá <code className="bg-muted px-1 rounded text-xs">{'{nombre}'}</code> para personalizar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <Textarea
                placeholder={`Hola {nombre}, te extrañamos en la barbería! Esta semana tenés un 20% de descuento en tu próximo corte. Reservá en nuestra web 💈`}
                value={mensajePromo}
                onChange={e => setMensajePromo(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalPromo(false)}>Cancelar</Button>
              <Button disabled={enviando || !mensajePromo.trim()} onClick={enviarPromo} className="gap-2">
                <Send className="size-4" />
                {enviando ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal editar cliente */}
      <Dialog open={!!clienteEditar} onOpenChange={open => { if (!open) setClienteEditar(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Modificá los datos del cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={formEditar.nombre_completo} onChange={e => setFormEditar(p => ({ ...p, nombre_completo: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={formEditar.telefono} onChange={e => setFormEditar(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={formEditar.correo_electronico} onChange={e => setFormEditar(p => ({ ...p, correo_electronico: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={formEditar.notas_cliente} onChange={e => setFormEditar(p => ({ ...p, notas_cliente: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClienteEditar(null)}>Cancelar</Button>
            <Button onClick={guardarEditar} disabled={guardandoEditar}>{guardandoEditar ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
