"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { barberos, turnos, clientes, servicios } from "@/lib/mock-data"
import type { Appointment, AppointmentStatus, Client } from "@/lib/types"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Check, 
  X, 
  Play,
  History,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  ChevronRight,
  Plus,
  Bell,
  UserX
} from "lucide-react"

export default function PanelBarbero() {
  const params = useParams()
  const barberoId = params.id as string
  
  const barbero = barberos.find(b => b.id === barberoId)
  const [turnosState, setTurnosState] = useState<Appointment[]>([])
  const [selectedTurno, setSelectedTurno] = useState<Appointment | null>(null)
  const [showClienteHistorial, setShowClienteHistorial] = useState(false)
  const [showNuevoTurno, setShowNuevoTurno] = useState(false)
  const [showNotificaciones, setShowNotificaciones] = useState(false)
  const [notificaciones, setNotificaciones] = useState([
    { id: 1, mensaje: "Nueva reserva: Juan Perez a las 15:00", leida: false, fecha: new Date() },
    { id: 2, mensaje: "Recordatorio: Turno con Pedro Garcia en 30 min", leida: false, fecha: new Date() },
  ])

  // Datos para nuevo turno por orden de llegada
  const [nuevoTurno, setNuevoTurno] = useState({
    clienteId: "",
    servicioId: "",
    nombreCliente: "",
    telefonoCliente: ""
  })

  useEffect(() => {
    // Filtrar turnos del barbero para hoy
    const hoy = new Date().toISOString().split('T')[0]
    const turnosBarbero = turnos.filter(
      t => t.barberoId === barberoId && t.fecha === hoy
    ).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    setTurnosState(turnosBarbero)
  }, [barberoId])

  if (!barbero) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Barbero no encontrado</p>
      </div>
    )
  }

  // Calcular estadisticas del dia
  const turnosHoy = turnosState.length
  const turnosCompletados = turnosState.filter(t => t.estado === 'finalizado').length
  const turnosPendientes = turnosState.filter(t => ['reservado', 'confirmado'].includes(t.estado)).length
  const ausenciasHoy = turnosState.filter(t => t.estado === 'ausente').length
  const ingresosDia = turnosState
    .filter(t => t.estado === 'finalizado')
    .reduce((sum, t) => sum + t.precioFinal, 0)

  // Funcion para cambiar estado del turno
  const cambiarEstadoTurno = (turnoId: string, nuevoEstado: AppointmentStatus) => {
    setTurnosState(prev => 
      prev.map(t => t.id === turnoId ? { ...t, estado: nuevoEstado } : t)
    )
    setSelectedTurno(null)
  }

  // Obtener historial del cliente
  const getHistorialCliente = (clienteId: string) => {
    return turnos.filter(t => t.clienteId === clienteId && t.estado === 'finalizado')
  }

  // Obtener color del badge segun estado
  const getEstadoBadge = (estado: AppointmentStatus) => {
    const estilos: Record<AppointmentStatus, string> = {
      reservado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      confirmado: "bg-green-500/20 text-green-400 border-green-500/30",
      finalizado: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
      cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
      ausente: "bg-orange-500/20 text-orange-400 border-orange-500/30"
    }
    return estilos[estado]
  }

  const getEstadoLabel = (estado: AppointmentStatus) => {
    const labels: Record<AppointmentStatus, string> = {
      reservado: "Reservado",
      confirmado: "Confirmado",
      finalizado: "Finalizado",
      cancelado: "Cancelado",
      ausente: "Ausente"
    }
    return labels[estado]
  }

  // Turno actual o proximo
  const ahora = new Date()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
  const turnoActual = turnosState.find(t => 
    ['reservado', 'confirmado'].includes(t.estado) && 
    t.horaInicio <= horaActual && 
    t.horaFin > horaActual
  )
  const proximoTurno = turnosState.find(t => 
    ['reservado', 'confirmado'].includes(t.estado) && 
    t.horaInicio > horaActual
  )

  // Registrar turno por orden de llegada
  const registrarTurnoOrdenLlegada = () => {
    if (!nuevoTurno.clienteId && !nuevoTurno.nombreCliente) return

    // Encontrar siguiente hora disponible
    const ultimoTurno = turnosState
      .filter(t => !['cancelado', 'ausente'].includes(t.estado))
      .sort((a, b) => b.horaFin.localeCompare(a.horaFin))[0]
    
    const horaInicio = ultimoTurno ? ultimoTurno.horaFin : horaActual
    const [h, m] = horaInicio.split(':').map(Number)
    const finDate = new Date()
    finDate.setHours(h)
    finDate.setMinutes(m + 30) // Duracion por defecto 30 min
    const horaFin = `${finDate.getHours().toString().padStart(2, '0')}:${finDate.getMinutes().toString().padStart(2, '0')}`

    // Buscar o crear cliente
    let cliente: Client
    if (nuevoTurno.clienteId) {
      cliente = clientes.find(c => c.id === nuevoTurno.clienteId)!
    } else {
      cliente = {
        id: `c_temp_${Date.now()}`,
        nombre: nuevoTurno.nombreCliente || "Cliente sin nombre",
        telefono: nuevoTurno.telefonoCliente || "",
        email: "",
        rol: 'cliente',
        activo: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
        historialTurnos: [],
        turnosTotales: 0,
        ultimaVisita: null,
        esClienteFrecuente: false,
        ausencias: 0
      }
    }

    // Servicio generico por defecto
    const servicioGenerico = servicios[0]

    const nuevoTurnoObj: Appointment = {
      id: `t_${Date.now()}`,
      clienteId: cliente.id,
      cliente,
      barberoId,
      barbero,
      servicioId: servicioGenerico.id,
      servicio: servicioGenerico,
      fecha: new Date().toISOString().split('T')[0],
      horaInicio,
      horaFin,
      estado: 'confirmado',
      tipo: 'orden_llegada',
      precioFinal: 0, // El precio se define al cobrar
      fechaCreacion: new Date().toISOString().split('T')[0]
    }

    setTurnosState(prev => [...prev, nuevoTurnoObj].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)))
    setShowNuevoTurno(false)
    setNuevoTurno({ clienteId: "", servicioId: "", nombreCliente: "", telefonoCliente: "" })
  }

  const notificacionesSinLeer = notificaciones.filter(n => !n.leida).length

  return (
    <div className="px-4 py-4">
      {/* Saludo y fecha */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Hola, {barbero.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => setShowNotificaciones(true)}
        >
          <Bell className="h-5 w-5" />
          {notificacionesSinLeer > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {notificacionesSinLeer}
            </span>
          )}
        </Button>
      </div>

      {/* Metricas rapidas */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <Card className="bg-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{turnosHoy}</div>
            <div className="text-xs text-muted-foreground">Turnos</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{turnosCompletados}</div>
            <div className="text-xs text-muted-foreground">Hechos</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{turnosPendientes}</div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">${(ingresosDia / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Hoy</div>
          </CardContent>
        </Card>
      </div>

      {/* Turno actual o proximo */}
      {(turnoActual || proximoTurno) && (
        <Card className="mb-4 border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-primary">
                {turnoActual ? "Turno Actual" : "Proximo Turno"}
              </span>
              <Badge className={getEstadoBadge((turnoActual || proximoTurno)!.estado)}>
                {getEstadoLabel((turnoActual || proximoTurno)!.estado)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {(turnoActual || proximoTurno)!.cliente.nombre}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(turnoActual || proximoTurno)!.servicio.nombre}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {(turnoActual || proximoTurno)!.horaInicio}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(turnoActual || proximoTurno)!.servicio.duracion} min
                </div>
              </div>
            </div>
<div className="mt-3 flex gap-2">
                {(turnoActual || proximoTurno)!.estado === 'reservado' && (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => cambiarEstadoTurno((turnoActual || proximoTurno)!.id, 'confirmado')}
                  >
                    <Check className="mr-1 h-4 w-4" /> Confirmar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedTurno((turnoActual || proximoTurno)!)
                  }}
                >
                  Ver mas
                </Button>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Boton para agregar turno por orden de llegada */}
      <Button 
        className="mb-4 w-full" 
        variant="outline"
        onClick={() => setShowNuevoTurno(true)}
      >
        <Plus className="mr-2 h-4 w-4" /> Registrar turno por orden de llegada
      </Button>

      {/* Tabs de contenido */}
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Lista de turnos de hoy */}
        <TabsContent value="hoy" className="mt-4 space-y-3">
          {turnosState.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes turnos para hoy</p>
              </CardContent>
            </Card>
          ) : (
            turnosState.map((turno) => (
              <Card 
                key={turno.id} 
                className={`transition-all ${
                  turno.estado === 'finalizado' ? 'opacity-60' : ''
                } ${
                  turno.estado === 'ausente' ? 'border-orange-500/30' : ''
                }`}
                onClick={() => setSelectedTurno(turno)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-muted">
                        <span className="text-xs font-bold text-foreground">{turno.horaInicio}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{turno.cliente.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{turno.servicio.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getEstadoBadge(turno.estado)}>
                        {getEstadoLabel(turno.estado)}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Agenda de la semana */}
        <TabsContent value="agenda" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Proximos dias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((dia) => {
                const fecha = new Date()
                fecha.setDate(fecha.getDate() + dia)
                const fechaStr = fecha.toISOString().split('T')[0]
                const turnosDia = turnos.filter(
                  t => t.barberoId === barberoId && t.fecha === fechaStr
                )
                return (
                  <div key={dia} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">
                        {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {turnosDia.length} {turnosDia.length === 1 ? 'turno' : 'turnos'}
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {turnosDia.slice(0, 3).map((t, i) => (
                        <div 
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-medium text-primary"
                        >
                          {t.horaInicio.split(':')[0]}
                        </div>
                      ))}
                      {turnosDia.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
                          +{turnosDia.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estadisticas del barbero */}
        <TabsContent value="stats" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Este mes</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Turnos atendidos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{barbero.estadisticas.turnosMes}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Ingresos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${(barbero.estadisticas.ingresosMes / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Calificacion</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{barbero.estadisticas.calificacionPromedio}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserX className="h-4 w-4" />
                  <span className="text-xs">Ausencias</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{ausenciasHoy}</p>
              </div>
            </CardContent>
          </Card>

          {/* Servicios mas realizados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Servicios realizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {servicios.slice(0, 4).map((servicio, index) => {
                const cantidad = Math.floor(Math.random() * 30) + 10
                const porcentaje = (cantidad / 50) * 100
                return (
                  <div key={servicio.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{servicio.nombre}</span>
                      <span className="text-muted-foreground">{cantidad}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalle del turno */}
      <Dialog open={!!selectedTurno} onOpenChange={() => setSelectedTurno(null)}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md">
          {selectedTurno && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Detalle del turno</span>
                  <Badge className={getEstadoBadge(selectedTurno.estado)}>
                    {getEstadoLabel(selectedTurno.estado)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Info del cliente */}
                <div className="rounded-lg bg-muted p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{selectedTurno.cliente.nombre}</span>
                    {selectedTurno.cliente.esClienteFrecuente && (
                      <Badge variant="secondary" className="text-xs">Frecuente</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${selectedTurno.cliente.telefono}`} className="hover:text-primary">
                        {selectedTurno.cliente.telefono}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{selectedTurno.cliente.email}</span>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-2 h-auto p-0 text-primary"
                    onClick={() => setShowClienteHistorial(true)}
                  >
                    <History className="mr-1 h-3 w-3" /> Ver historial ({selectedTurno.cliente.turnosTotales} visitas)
                  </Button>
                </div>

                {/* Info del servicio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Servicio</span>
                    <span className="font-medium text-foreground">{selectedTurno.servicio.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Horario</span>
                    <span className="font-medium text-foreground">
                      {selectedTurno.horaInicio} - {selectedTurno.horaFin}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duracion</span>
                    <span className="font-medium text-foreground">{selectedTurno.servicio.duracion} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio</span>
                    <span className="font-medium text-primary">${selectedTurno.precioFinal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {selectedTurno.tipo === 'reserva_previa' ? 'Reserva previa' : 'Orden de llegada'}
                    </Badge>
                  </div>
                </div>

                {selectedTurno.notas && (
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm text-foreground">{selectedTurno.notas}</p>
                  </div>
                )}

                {selectedTurno.cliente.notas && (
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-yellow-500">Nota del cliente</p>
                      <p className="text-sm text-foreground">{selectedTurno.cliente.notas}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                {selectedTurno.estado === 'reservado' && (
                  <Button 
                    className="w-full"
                    onClick={() => cambiarEstadoTurno(selectedTurno.id, 'confirmado')}
                  >
                    <Check className="mr-1 h-4 w-4" /> Confirmar turno
                  </Button>
                )}
                {['confirmado', 'finalizado', 'ausente', 'cancelado'].includes(selectedTurno.estado) && (
                  <p className="text-center text-sm text-muted-foreground">
                    Este turno esta {getEstadoLabel(selectedTurno.estado).toLowerCase()}
                  </p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal historial del cliente */}
      <Dialog open={showClienteHistorial} onOpenChange={setShowClienteHistorial}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Historial de {selectedTurno?.cliente.nombre}</DialogTitle>
            <DialogDescription>
              {selectedTurno?.cliente.turnosTotales} visitas en total
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {selectedTurno && getHistorialCliente(selectedTurno.clienteId).slice(0, 10).map((turno) => (
              <div key={turno.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="font-medium text-foreground">{turno.servicio.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(turno.fecha).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <span className="text-primary">${turno.precioFinal.toLocaleString()}</span>
              </div>
            ))}
            {selectedTurno && getHistorialCliente(selectedTurno.clienteId).length === 0 && (
              <p className="text-center text-muted-foreground">Sin historial previo</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nuevo turno por orden de llegada */}
      <Dialog open={showNuevoTurno} onOpenChange={setShowNuevoTurno}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo turno por orden de llegada</DialogTitle>
            <DialogDescription>
              Registra un cliente que llego sin reserva
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente existente (opcional)</Label>
              <Select 
                value={nuevoTurno.clienteId}
                onValueChange={(value) => setNuevoTurno(prev => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!nuevoTurno.clienteId && (
              <>
                <div className="space-y-2">
                  <Label>Nombre del cliente</Label>
                  <Input 
                    value={nuevoTurno.nombreCliente}
                    onChange={(e) => setNuevoTurno(prev => ({ ...prev, nombreCliente: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono (opcional)</Label>
                  <Input 
                    value={nuevoTurno.telefonoCliente}
                    onChange={(e) => setNuevoTurno(prev => ({ ...prev, telefonoCliente: e.target.value }))}
                    placeholder="+54 11..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={registrarTurnoOrdenLlegada}
              disabled={!nuevoTurno.clienteId && !nuevoTurno.nombreCliente}
            >
              <Plus className="mr-2 h-4 w-4" /> Registrar turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal notificaciones */}
      <Dialog open={showNotificaciones} onOpenChange={setShowNotificaciones}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notificaciones</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`rounded-lg p-3 ${notif.leida ? 'bg-muted/50' : 'bg-primary/10 border border-primary/30'}`}
                onClick={() => {
                  setNotificaciones(prev => 
                    prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
                  )
                }}
              >
                <p className={`text-sm ${notif.leida ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {notif.mensaje}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {notif.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
