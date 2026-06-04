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
    <div className="w-full min-h-screen bg-[#070708] text-zinc-100 p-4 md:p-8 flex flex-col gap-6">
      {/* Saludo y fecha */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Hola, {barbero.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-zinc-400 capitalize mt-1">
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
          className="relative bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
          onClick={() => setShowNotificaciones(true)}
        >
          <Bell className="h-5 w-5" />
          {notificacionesSinLeer > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
              {notificacionesSinLeer}
            </span>
          )}
        </Button>
      </div>

      {/* Metricas rapidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="bg-[#111113] border-zinc-800/80">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-white tracking-tight">{turnosHoy}</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-2">Turnos</div>
          </CardContent>
        </Card>
        <Card className="bg-[#121214] border-zinc-800/80">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-green-400 tracking-tight">{turnosCompletados}</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-2">Hechos</div>
          </CardContent>
        </Card>
        <Card className="bg-[#121214] border-zinc-800/80">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-blue-400 tracking-tight">{turnosPendientes}</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-2">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="bg-[#121214] border-zinc-800/80">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-amber-400 tracking-tight">${(ingresosDia / 1000).toFixed(1)}k</div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-2">Hoy</div>
          </CardContent>
        </Card>
      </div>

      {/* Seccion Proximo Turno Horizontal Fijo */}
      {(turnoActual || proximoTurno) && (
        <Card className="w-full bg-[#0d0d0f] border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <CardContent className="p-5 flex items-center justify-between w-full">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">PROXIMO TURNO</p>
              <h3 className="text-xl font-bold text-white">{(turnoActual || proximoTurno)!.cliente.nombre}</h3>
              <p className="text-xs text-zinc-400">{(turnoActual || proximoTurno)!.servicio.nombre}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-3 bg-zinc-900 border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white mt-2"
                onClick={() => setSelectedTurno(turnoActual || proximoTurno)}
              >
                Ver mas
              </Button>
            </div>
            
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-2xl font-bold text-white">{(turnoActual || proximoTurno)!.horaInicio}</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{(turnoActual || proximoTurno)!.servicio.duracion} min</p>
              </div>
              <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 rounded font-semibold text-xs px-2.5 py-0.5 self-start">
                {getEstadoLabel((turnoActual || proximoTurno)!.estado)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boton para agregar turno */}
      <Button 
        className="w-full h-12 text-zinc-200 bg-[#121214] hover:bg-zinc-800 border-zinc-800 font-medium" 
        variant="outline"
        onClick={() => setShowNuevoTurno(true)}
      >
        <Plus className="mr-2 h-4 w-4" /> Registrar turno por orden de llegada
      </Button>

      {/* Estructura de solapas */}
      <Tabs defaultValue="hoy" className="w-full flex flex-col gap-4">
        <TabsList className="w-full flex justify-between items-center rounded-none h-12 bg-transparent border-b border-zinc-800 p-0">
          <TabsTrigger 
            value="hoy" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-zinc-900/40 text-sm font-semibold text-zinc-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-zinc-400"
          >
            Hoy
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-zinc-900/40 text-sm font-semibold text-zinc-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-zinc-400"
          >
            Agenda
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="flex-1 h-full text-center rounded-none data-[state=active]:bg-zinc-900/40 text-sm font-semibold text-zinc-400 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-zinc-400"
          >
            Stats
          </TabsTrigger>
        </TabsList>

        {/* CONTENIDO: HOY */}
        <TabsContent value="hoy" className="w-full space-y-3 focus-visible:outline-none">
          <div className="w-full flex flex-col gap-3">
            {turnosState.length === 0 ? (
              <Card className="bg-[#121214] border-zinc-800 w-full">
                <CardContent className="p-12 text-center">
                  <Calendar className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
                  <p className="text-zinc-400 font-medium">No tienes turnos para hoy</p>
                </CardContent>
              </Card>
            ) : (
              turnosState.map((turno) => (
                <Card 
                  key={turno.id} 
                  className={`bg-[#121214] border-zinc-800/80 transition-all hover:bg-zinc-800/40 cursor-pointer w-full ${
                    turno.estado === 'finalizado' ? 'opacity-50' : ''
                  }`}
                  onClick={() => setSelectedTurno(turno)}
                >
                  <CardContent className="p-5 flex items-center justify-between w-full">
                    <div className="flex items-center gap-6">
                      <div className="flex h-10 w-16 flex-col items-center justify-center rounded-md bg-zinc-900 border border-zinc-800">
                        <span className="text-sm font-bold text-zinc-200">{turno.horaInicio}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">{turno.cliente.nombre}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{turno.servicio.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`px-4 py-1 text-xs font-bold rounded-md bg-zinc-900 border ${getEstadoBadge(turno.estado)}`}>
                        {getEstadoLabel(turno.estado)}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-zinc-500" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* CONTENIDO: AGENDA */}
        <TabsContent value="agenda" className="w-full focus-visible:outline-none">
          <Card className="bg-[#121214] border-zinc-800 w-full">
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((dia) => {
                const fecha = new Date()
                fecha.setDate(fecha.getDate() + dia)
                const fechaStr = fecha.toISOString().split('T')[0]
                const turnosDia = turnos.filter(
                  t => t.barberoId === barberoId && t.fecha === fechaStr
                )
                return (
                  <div key={dia} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-base text-white capitalize">
                        {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {turnosDia.length} {turnosDia.length === 1 ? 'turno' : 'turnos'} programados
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {turnosDia.slice(0, 3).map((t, i) => (
                        <div 
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#121214] bg-zinc-900 text-xs font-bold text-zinc-300"
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
        <TabsContent value="stats" className="w-full space-y-8 focus-visible:outline-none bg-[#121214] border border-zinc-800 rounded-lg p-6 md:p-8">
          {/* SECCIÓN 1: ESTE MES */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white">Este mes</h3>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 w-full">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    <span>Turnos atendidos</span>
                  </div>
                  <p className="text-4xl font-bold text-white mt-1">68</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Calificación</span>
                  </div>
                  <p className="text-4xl font-bold text-white mt-1">4.8</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <span className="text-sm font-semibold relative top-[-2px]">$</span>
                    <span>Ingresos</span>
                  </div>
                  <p className="text-4xl font-bold text-white mt-1">$185k</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <UserX className="h-3.5 w-3.5" />
                    <span>Ausencias</span>
                  </div>
                  <p className="text-4xl font-bold text-white mt-1">0</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-zinc-800/60 my-6" />

          {/* SECCIÓN 2: SERVICIOS REALIZADOS */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white">Servicios realizados</h3>
            <div className="space-y-6 w-full">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-200">Corte de Cabello</span>
                  <span className="text-zinc-400 text-xs">35</span>
                </div>
                <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#eab308]" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-200">Corte + Barba</span>
                  <span className="text-zinc-400 text-xs">26</span>
                </div>
                <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#eab308]" style={{ width: '74%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-200">Arreglo de Barba</span>
                  <span className="text-zinc-400 text-xs">10</span>
                </div>
                <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#eab308]" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-200">Fade Premium</span>
                  <span className="text-zinc-400 text-xs">35</span>
                </div>
                <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#eab308]" style={{ width: '74%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: DETALLE DEL TURNO */}
      <Dialog open={!!selectedTurno} onOpenChange={() => setSelectedTurno(null)}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-[#09090b] border-zinc-800 text-white p-6">
          {selectedTurno && (
            <>
              <DialogHeader className="relative flex flex-row items-center justify-between border-none pb-0">
                <DialogTitle className="text-lg font-bold text-white">Detalle del turno</DialogTitle>
                <Badge className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-zinc-900 border ${getEstadoBadge(selectedTurno.estado)}`}>
                  {getEstadoLabel(selectedTurno.estado)}
                </Badge>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="rounded-lg bg-[#121214] border border-zinc-800 p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="font-bold text-white text-sm">{selectedTurno.cliente.nombre}</span>
                    <span className="text-[11px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-medium ml-1">Frecuente</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    <span>{selectedTurno.cliente.telefono || "+54 11 5555-1234"}</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    <span>{selectedTurno.cliente.email || "juan.perez@email.com"}</span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-amber-500 text-xs font-semibold flex items-center gap-1 mt-1 hover:no-underline" onClick={() => setShowClienteHistorial(true)}>
                    <History className="h-3.5 w-3.5" /> Ver historial (15 visitas)
                  </Button>
                </div>

                <div className="space-y-3 text-xs border-zinc-800/80 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Servicio</span>
                    <span className="font-semibold text-white text-right">{selectedTurno.servicio.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Horario</span>
                    <span className="font-bold text-white text-right">{selectedTurno.horaInicio} - {selectedTurno.horaFin}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Duración</span>
                    <span className="font-semibold text-zinc-300 text-right">{selectedTurno.servicio.duracion} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Precio</span>
                    <span className="font-bold text-amber-400 text-right">${selectedTurno.precioFinal || "5,500"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Tipo</span>
                    <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300 rounded font-medium">
                      Reserva previa
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg bg-[#fab005]/5 border border-[#fab005]/20 p-3 space-y-1 mt-2">
                  <div className="text-[10px] font-bold text-[#fab005] uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Nota del cliente
                  </div>
                  <p className="text-xs font-medium text-zinc-200">Prefiere corte bajo a los costados</p>
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-800/80 pt-4 flex flex-col items-center">
                <span className="text-zinc-500 text-xs font-medium bg-transparent px-2 py-0.5 rounded">
                  Este turno esta confirmado
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: HISTORIAL DEL CLIENTE */}
      <Dialog open={showClienteHistorial} onOpenChange={setShowClienteHistorial}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Historial de Turnos</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {selectedTurno && getHistorialCliente(selectedTurno.clienteId).map((turno) => (
              <div key={turno.id} className="flex items-center justify-between rounded-lg bg-zinc-900 p-3 border border-zinc-800">
                <div>
                  <p className="font-semibold text-sm text-zinc-200">{turno.servicio.nombre}</p>
                  <p className="text-xs text-zinc-500">{new Date(turno.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">${turno.precioFinal}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NUEVO TURNO POR ORDEN DE LLEGADA (CALCADO AL MILÍMETRO A image_6b72e1.png) */}
      <Dialog open={showNuevoTurno} onOpenChange={setShowNuevoTurno}>
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-[#09090b] border-zinc-800 text-white p-6">
          <DialogHeader className="border-none pb-0">
            <DialogTitle className="text-lg font-bold text-white">Nuevo turno por orden de llegada</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              Registra un cliente que llego sin reserva
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Campo 1 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-200">Cliente existente (opcional)</Label>
              <Select 
                value={nuevoTurno.clienteId}
                onValueChange={(value) => setNuevoTurno(prev => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-300 h-10">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-zinc-800 text-white">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id} className="focus:bg-zinc-800 focus:text-white">
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo 2 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-200">Nombre del cliente</Label>
              <Input 
                className="bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-600 h-10"
                value={nuevoTurno.nombreCliente}
                onChange={(e) => setNuevoTurno(prev => ({ ...prev, nombreCliente: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            {/* Campo 3 */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-200">Telefono (opcional)</Label>
              <Input 
                className="bg-zinc-900/50 border-zinc-800 text-white placeholder-zinc-600 h-10"
                value={nuevoTurno.telefonoCliente}
                onChange={(e) => setNuevoTurno(prev => ({ ...prev, telefonoCliente: e.target.value }))}
                placeholder="+54 11..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              className="w-full h-11 bg-[#786235] hover:bg-[#614e2a] text-zinc-100 font-semibold rounded-md flex items-center justify-center gap-2" 
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
        <DialogContent className="max-w-[95vw] rounded-lg sm:max-w-md bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Bandeja de Notificaciones</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {notificaciones.map((notif) => (
              <div 
                key={notif.id} 
                className={`rounded-lg p-3 border transition-colors cursor-pointer ${notif.leida ? 'bg-zinc-900/40 border-zinc-800' : 'bg-amber-500/10 border-amber-500/30'}`}
                onClick={() => {
                  setNotificaciones(prev => 
                    prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
                  )
                }}
              >
                <p className={`text-sm ${notif.leida ? 'text-zinc-400' : 'text-zinc-100 font-medium'}`}>{notif.mensaje}</p>
                <p className="mt-1 text-xs text-zinc-500">{notif.fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}