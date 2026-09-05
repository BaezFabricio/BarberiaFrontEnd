"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
  User, 
  Phone, 
  Mail, 
  History,
  TrendingUp,
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
  const turnosCompletados = turnosState.filter(t => ['atendido', 'cobrado'].includes(t.estado)).length
  const turnosPendientes = turnosState.filter(t => ['pendiente', 'confirmado'].includes(t.estado)).length
  const ingresosDia = turnosState
    .filter(t => ['atendido', 'cobrado'].includes(t.estado))
    .reduce((sum, t) => sum + t.precioFinal, 0)

  // Obtener historial del cliente
  const getHistorialCliente = (clienteId: string) => {
    return turnos.filter(t => t.clienteId === clienteId && ['atendido', 'cobrado'].includes(t.estado))
  }

  // Obtener color del badge segun estado
  const getEstadoBadge = (estado: AppointmentStatus) => {
    const estilos: Record<AppointmentStatus, string> = {
      pendiente:  "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
      confirmado: "bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
      atendido:   "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-400 dark:border-zinc-500/30",
      cobrado:    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
      cancelado:  "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
      ausente:    "bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30"
    }
    return estilos[estado]
  }

  const getEstadoLabel = (estado: AppointmentStatus) => {
    const labels: Record<AppointmentStatus, string> = {
      pendiente:  "Pendiente",
      confirmado: "Confirmado",
      atendido:   "Atendido",
      cobrado:    "Cobrado",
      cancelado:  "Cancelado",
      ausente:    "Ausente"
    }
    return labels[estado]
  }

  // Turno actual o proximo
  const ahora = new Date()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
  const turnoActual = turnosState.find(t => 
    ['pendiente', 'confirmado'].includes(t.estado) &&
    t.horaInicio <= horaActual && 
    t.horaFin > horaActual
  )
  const proximoTurno = turnosState.find(t => 
    ['pendiente', 'confirmado'].includes(t.estado) &&
    t.horaInicio > horaActual
  )

  const abrirDetalleProximoTurno = () => {
    const turnoDestacado = turnoActual || proximoTurno
    if (turnoDestacado) {
      setSelectedTurno(turnoDestacado)
    }
  }

  // Registrar turno por orden de llegada
  const registrarTurnoOrdenLlegada = () => {
    if (!nuevoTurno.clienteId && !nuevoTurno.nombreCliente) return

    const ultimoTurno = turnosState
      .filter(t => !['cancelado', 'ausente'].includes(t.estado))
      .sort((a, b) => b.horaFin.localeCompare(a.horaFin))[0]
    
    const horaInicio = ultimoTurno ? ultimoTurno.horaFin : horaActual
    const [h, m] = horaInicio.split(':').map(Number)
    const finDate = new Date()
    finDate.setHours(h)
    finDate.setMinutes(m + 30)
    const horaFin = `${finDate.getHours().toString().padStart(2, '0')}:${finDate.getMinutes().toString().padStart(2, '0')}`

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

    const servicioSeleccionado = servicios.find(s => s.id === nuevoTurno.servicioId) || servicios[0]

    const nuevoTurnoObj: Appointment = {
      id: `t_${Date.now()}`,
      clienteId: cliente.id,
      cliente,
      barberoId,
      barbero,
      servicioId: servicioSeleccionado.id,
      servicio: servicioSeleccionado,
      fecha: new Date().toISOString().split('T')[0],
      horaInicio,
      horaFin,
      estado: 'confirmado',
      tipo: 'orden_llegada',
      precioFinal: servicioSeleccionado.precio,
      fechaCreacion: new Date().toISOString().split('T')[0]
    }

    setTurnosState(prev => [...prev, nuevoTurnoObj].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)))
    setShowNuevoTurno(false)
    setNuevoTurno({ clienteId: "", servicioId: "", nombreCliente: "", telefonoCliente: "" })
  }

  const notificacionesSinLeer = notificaciones.filter(n => !n.leida).length

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col gap-6">
      
      {/* SECCIÓN 1: TARJETA PROXIMO TURNO */}
      {(turnoActual || proximoTurno) && (
        <Card className="bg-card border-border w-full">
          <CardContent className="p-5 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase">PROXIMO TURNO</p>
            <div className="flex items-center justify-between mt-1">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-card-foreground">
                  {(turnoActual || proximoTurno)!.cliente.nombre}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(turnoActual || proximoTurno)!.servicio.nombre}
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <Badge className={`px-2 py-0.5 text-[10px] font-semibold border rounded ${getEstadoBadge((turnoActual || proximoTurno)!.estado)}`}>
                  {getEstadoLabel((turnoActual || proximoTurno)!.estado)}
                </Badge>
                <p className="text-2xl font-bold text-card-foreground tracking-tight mt-1">
                  {(turnoActual || proximoTurno)!.horaInicio}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {(turnoActual || proximoTurno)!.servicio.duracion} min
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-3 text-[11px] font-medium"
                onClick={abrirDetalleProximoTurno}
              >
                Ver mas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECCIÓN 2: SALUDO Y FECHA */}
      <div className="flex items-center justify-between w-full px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {barbero.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
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
          className="relative h-10 w-10"
          onClick={() => setShowNotificaciones(true)}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {notificacionesSinLeer > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {notificacionesSinLeer}
            </span>
          )}
        </Button>
      </div>

      {/* SECCIÓN 3: METRICAS RAPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold tracking-tight">{turnosHoy}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-2">Turnos</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 tracking-tight">{turnosCompletados}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-2">Hechos</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">{turnosPendientes}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-2">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-primary tracking-tight">${(ingresosDia / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-2">Hoy</div>
          </CardContent>
        </Card>
      </div>

      {/* Boton para agregar turno */}
      <Button 
        className="w-full h-12 font-medium" 
        variant="outline"
        onClick={() => setShowNuevoTurno(true)}
      >
        <Plus className="mr-2 h-4 w-4" /> Registrar turno por orden de llegada
      </Button>

      {/* Estructura de solapas */}
      <Tabs defaultValue="hoy" className="w-full flex flex-col gap-4">
        <TabsList className="w-full flex justify-between items-center rounded-none h-12 bg-transparent border-b border-border p-0">
          <TabsTrigger 
            value="hoy" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-muted/50 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Hoy
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-muted/50 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Agenda
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-muted/50 text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Stats
          </TabsTrigger>
        </TabsList>

        {/* CONTENIDO: HOY */}
        <TabsContent value="hoy" className="w-full space-y-3 focus-visible:outline-none">
          <div className="w-full flex flex-col gap-3">
            {turnosState.length === 0 ? (
              <Card className="border-border w-full">
                <CardContent className="p-12 text-center">
                  <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-60" />
                  <p className="text-muted-foreground font-medium">No tienes turnos para hoy</p>
                </CardContent>
              </Card>
            ) : (
              turnosState.map((turno) => (
                <Card 
                  key={turno.id} 
                  className={`bg-card border-border/80 transition-all hover:bg-muted/50 cursor-pointer w-full ${
                    ['cobrado', 'cancelado'].includes(turno.estado) ? 'opacity-50' : ''
                  }`}
                  onClick={() => setSelectedTurno(turno)}
                >
                  <CardContent className="p-5 flex items-center justify-between w-full">
                    <div className="flex items-center gap-6">
                      <div className="flex h-10 w-16 flex-col items-center justify-center rounded-md bg-muted border border-border">
                        <span className="text-sm font-bold">{turno.horaInicio}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{turno.cliente.nombre}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{turno.servicio.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`px-4 py-1 text-xs font-bold border rounded-md ${getEstadoBadge(turno.estado)}`}>
                        {getEstadoLabel(turno.estado)}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* CONTENIDO: AGENDA */}
        <TabsContent value="agenda" className="w-full focus-visible:outline-none">
          <Card className="bg-card border-border w-full">
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((dia) => {
                const fecha = new Date()
                fecha.setDate(fecha.getDate() + dia)
                const fechaStr = fecha.toISOString().split('T')[0]
                const turnosDia = turnos.filter(
                  t => t.barberoId === barberoId && t.fecha === fechaStr
                )
                return (
                  <div key={dia} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-base capitalize">
                        {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {turnosDia.length} {turnosDia.length === 1 ? 'turno' : 'turnos'} programados
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {turnosDia.slice(0, 3).map((t, i) => (
                        <div 
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground"
                        >
                          {t.horaInicio.split(':')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENIDO: STATS */}
        <TabsContent value="stats" className="w-full space-y-8 focus-visible:outline-none bg-card border border-border rounded-lg p-6 md:p-8">
          {/* SECCIÓN 1: ESTE MES */}
          <div className="space-y-6">
            <h3 className="text-base font-bold">Este mes</h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 w-full">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Users className="h-3.5 w-3.5" />
                    <span>Turnos atendidos</span>
                  </div>
                  <p className="text-4xl font-bold mt-1">68</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Calificación</span>
                  </div>
                  <p className="text-4xl font-bold mt-1">4.8</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <span className="text-sm font-semibold relative top-[-2px]">$</span>
                    <span>Ingresos</span>
                  </div>
                  <p className="text-4xl font-bold mt-1">$185k</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <UserX className="h-3.5 w-3.5" />
                    <span>Ausencias</span>
                  </div>
                  <p className="text-4xl font-bold mt-1">0</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border my-6" />

          {/* SECCIÓN 2: SERVICIOS REALIZADOS */}
          <div className="space-y-6">
            <h3 className="text-base font-bold">Servicios realizados</h3>
            <div className="space-y-6 w-full">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Corte de Cabello</span>
                  <span className="text-muted-foreground text-xs">35</span>
                </div>
                <div className="w-full h-[3px] bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Corte + Barba</span>
                  <span className="text-muted-foreground text-xs">26</span>
                </div>
                <div className="w-full h-[3px] bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Arreglo de Barba</span>
                  <span className="text-muted-foreground text-xs">10</span>
                </div>
                <div className="w-full h-[3px] bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Fade Premium</span>
                  <span className="text-muted-foreground text-xs">35</span>
                </div>
                <div className="w-full h-[3px] bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: DETALLE DEL TURNO */}
      <Dialog open={!!selectedTurno} onOpenChange={() => setSelectedTurno(null)}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-background border-border p-6">
          {selectedTurno && (
            <>
              <DialogHeader className="relative flex flex-row items-center justify-between border-none pb-0">
                <DialogTitle className="text-lg font-bold">Detalle del turno</DialogTitle>
                <Badge className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${getEstadoBadge(selectedTurno.estado)}`}>
                  {getEstadoLabel(selectedTurno.estado)}
                </Badge>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="rounded-lg bg-muted border border-border p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-sm">{selectedTurno.cliente.nombre}</span>
                    <span className="text-[11px] bg-background text-muted-foreground px-1.5 py-0.5 rounded font-medium ml-1">Frecuente</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    <span>{selectedTurno.cliente.telefono || "+54 11 5555-1234"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    <span>{selectedTurno.cliente.email || "juan.perez@email.com"}</span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-primary text-xs font-semibold flex items-center gap-1 mt-1 hover:no-underline" onClick={() => setShowClienteHistorial(true)}>
                    <History className="h-3.5 w-3.5" /> Ver historial (15 visitas)
                  </Button>
                </div>

                <div className="space-y-3 text-xs border-border pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-semibold text-right">{selectedTurno.servicio.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Horario</span>
                    <span className="font-bold text-right">{selectedTurno.horaInicio} - {selectedTurno.horaFin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-semibold text-muted-foreground text-right">{selectedTurno.servicio.duracion} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Precio</span>
                    <span className="font-bold text-primary text-right">${selectedTurno.precioFinal || "5,500"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline" className="text-[10px] bg-muted border-border text-muted-foreground rounded font-medium">
                      Reserva previa
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-1 mt-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Nota del cliente
                  </div>
                  <p className="text-xs font-medium">Prefiere corte bajo a los costados</p>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4 flex flex-col items-center">
                <span className="text-muted-foreground text-xs font-medium bg-transparent px-2 py-0.5 rounded">
                  Este turno esta confirmado
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: HISTORIAL DEL CLIENTE */}
      <Dialog open={showClienteHistorial} onOpenChange={setShowClienteHistorial}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Historial de Turnos</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {selectedTurno && getHistorialCliente(selectedTurno.clienteId).map((turno) => (
              <div key={turno.id} className="flex items-center justify-between rounded-lg bg-muted p-3 border border-border">
                <div>
                  <p className="font-semibold text-sm">{turno.servicio.nombre}</p>
                  <p className="text-xs text-muted-foreground">{new Date(turno.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <span className="text-sm font-bold text-primary">${turno.precioFinal}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NUEVO TURNO POR ORDEN DE LLEGADA */}
      <Dialog open={showNuevoTurno} onOpenChange={setShowNuevoTurno}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-background border-border p-6">
          <DialogHeader className="border-none pb-0">
            <DialogTitle className="text-lg font-bold">Nuevo turno por orden de llegada</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Registra un cliente que llego sin reserva
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Cliente existente (opcional)</Label>
              <Select 
                value={nuevoTurno.clienteId}
                onValueChange={(value) => setNuevoTurno(prev => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger className="bg-muted/50 border-border h-10">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Nombre del cliente</Label>
              <Input 
                className="bg-muted/50 border-border h-10"
                value={nuevoTurno.nombreCliente}
                onChange={(e) => setNuevoTurno(prev => ({ ...prev, nombreCliente: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Telefono (opcional)</Label>
              <Input 
                className="bg-muted/50 border-border h-10"
                value={nuevoTurno.telefonoCliente}
                onChange={(e) => setNuevoTurno(prev => ({ ...prev, telefonoCliente: e.target.value }))}
                placeholder="+54 11..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              className="w-full h-11 font-semibold rounded-md flex items-center justify-center gap-2" 
              onClick={registrarTurnoOrdenLlegada} 
              disabled={!nuevoTurno.clienteId && !nuevoTurno.nombreCliente}
            >
              <Plus className="h-4 w-4" /> Registrar turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOTIFICACIONES */}
      <Dialog open={showNotificaciones} onOpenChange={setShowNotificaciones}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Bandeja de Notificaciones</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`rounded-lg p-3 border transition-colors cursor-pointer ${notif.leida ? 'bg-muted/40 border-border' : 'bg-primary/10 border-primary/30'}`}
                onClick={() => {
                  setNotificaciones(prev => 
                    prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
                  )
                }}
              >
                <p className={`text-sm ${notif.leida ? 'text-muted-foreground' : 'font-medium'}`}>{notif.mensaje}</p>
                <p className="mt-1 text-xs text-muted-foreground">{notif.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}