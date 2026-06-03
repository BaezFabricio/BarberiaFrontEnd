"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Phone, Camera, MessageCircle, Check, ChevronRight, ChevronLeft, Scissors, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { barberos, servicios, horariosDisponibles, infoBarberia } from "@/lib/mock-data"

// Imagenes del carrusel
const carouselImages = [
  {
    url: "/images/barberia-1.jpg",
    alt: "Interior de Barber Studio"
  },
  {
    url: "/images/barberia-2.jpg",
    alt: "Corte de cabello profesional"
  },
  {
    url: "/images/barberia-3.jpg",
    alt: "Arreglo de barba"
  }
]

export default function ReservasPublicas() {
  const [step, setStep] = useState(1)
  const [logoAvailable, setLogoAvailable] = useState(true)
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null)
  const [selectedBarbero, setSelectedBarbero] = useState<string | null>(null)
  const [selectedFecha, setSelectedFecha] = useState<string>("")
  const [selectedHora, setSelectedHora] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [clienteData, setClienteData] = useState({
    nombre: "",
    telefono: "",
    email: ""
  })

  // Auto-play del carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  const serviciosActivos = servicios.filter(s => s.activo)
  const barberosActivos = barberos.filter(b => b.activo)

  const servicio = serviciosActivos.find(s => s.id === selectedServicio)
  const barbero = barberosActivos.find(b => b.id === selectedBarbero)

  const handleConfirmarReserva = () => {
    setShowConfirmation(true)
  }

  const resetReserva = () => {
    setStep(1)
    setSelectedServicio(null)
    setSelectedBarbero(null)
    setSelectedFecha("")
    setSelectedHora(null)
    setClienteData({ nombre: "", telefono: "", email: "" })
    setShowConfirmation(false)
  }

  // Generar fechas disponibles (proximos 14 dias)
  const fechasDisponibles = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayName: date.toLocaleDateString('es-AR', { weekday: 'long' })
    }
  }).filter(d => d.dayName !== 'domingo') // Filtrar domingos

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent overflow-hidden">
              {logoAvailable ? (
                // intenta cargar logo desde /logo.png en public/
                <img
                  src="/logo.png"
                  alt={infoBarberia.nombre}
                  className="h-10 w-10 object-contain bg-transparent"
                  onError={() => setLogoAvailable(false)}
                />
              ) : (
                <Scissors className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <span className="text-xl font-bold text-foreground">
              <span>{infoBarberia.nombre.split(' ')[0]} </span>
              <span className="text-[#e1c15a]">{infoBarberia.nombre.split(' ')[1]}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a 
              href={`https://wa.me/${infoBarberia.redesSociales.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Portada completa con 3 imágenes separadas por líneas negras */}
      <section className="relative w-full px-2 pt-2">
        <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-3 md:gap-0 md:rounded-[1.5rem]">
          {/* Columna 1 */}
          <a href="#seleccion-servicio" aria-label="Ir a reservar" className="group relative aspect-[16/10] overflow-hidden bg-black transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300/30 md:aspect-[4/5] rounded-2xl">
            <img src="/images/barberia-1.jpg" alt="Imagen 1" className="absolute inset-0 h-full w-full object-cover object-center brightness-100 contrast-102 saturate-95 transition-transform duration-700 ease-out group-hover:scale-102 group-hover:brightness-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/18" />
          </a>

          {/* Columna 2 */}
          <a href="#seleccion-servicio" aria-label="Ir a reservar" className="group relative aspect-[16/10] overflow-hidden bg-black transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300/30 md:aspect-[4/5] rounded-2xl">
            <img src="/images/barberia-2.jpg" alt="Imagen 2" className="absolute inset-0 h-full w-full object-cover object-[50%_35%] brightness-100 contrast-102 saturate-95 transition-transform duration-700 ease-out group-hover:scale-102 group-hover:brightness-105" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/14 transition-opacity duration-300 group-hover:from-black/12 group-hover:to-black/8" />
          </a>

          {/* Columna 3 */}
          <a href="#seleccion-servicio" aria-label="Ir a reservar" className="group relative aspect-[16/10] overflow-hidden bg-black transition-shadow duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300/30 md:aspect-[4/5] rounded-2xl">
            <img src="/images/barberia-3.jpg" alt="Imagen 3" className="absolute inset-0 h-full w-full object-cover object-center brightness-100 contrast-102 saturate-95 transition-transform duration-700 ease-out group-hover:scale-102 group-hover:brightness-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-black/12 transition-opacity duration-300 group-hover:from-black/14 group-hover:to-black/8" />
          </a>
        </div>

        {/* Título centrado sobre la portada eliminado por petición del usuario */}
      </section>

      {/* Yellow Highlight Box */}
      <section className="border-b border-border bg-transparent">
        <div className="container mx-auto flex justify-center px-4 py-6">
          <a
            href="#seleccion-servicio"
            className="group w-fit rounded-2xl border border-amber-400/70 bg-gradient-to-b from-amber-50/60 to-amber-100/30 dark:from-amber-300/25 dark:to-amber-500/15 px-6 py-4 text-center shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_16px_40px_rgba(251,191,36,0.12)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-background"
          >
            <h2 className="text-xl font-semibold tracking-tight transition-colors sm:text-2xl text-amber-700 dark:text-amber-100 group-hover:text-white">
              Reserva tu turno
            </h2>
          </a>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`mx-2 h-0.5 w-8 transition-colors sm:w-12 ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground sm:gap-8">
            <span className={step >= 1 ? "text-primary" : ""}>Servicio</span>
            <span className={step >= 2 ? "text-primary" : ""}>Barbero</span>
            <span className={step >= 3 ? "text-primary" : ""}>Fecha</span>
            <span className={step >= 4 ? "text-primary" : ""}>Datos</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Step 1: Seleccionar Servicio */}
        {step === 1 && (
          <div id="seleccion-servicio" className="mx-auto max-w-2xl scroll-mt-24">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Selecciona un servicio</h2>
            <div className="grid gap-3">
              {serviciosActivos.map((servicio) => (
                <Card
                  key={servicio.id}
                  className={`cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:ring-4 hover:ring-primary/30 hover:bg-primary/5 ${
                    selectedServicio === servicio.id
                      ? "border-primary ring-4 ring-primary/30 bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedServicio(servicio.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{servicio.nombre}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{servicio.descripcion}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {servicio.duracion} min
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-primary">
                        ${servicio.precio.toLocaleString('es-AR')}
                      </p>
                      {selectedServicio === servicio.id && (
                        <Check className="ml-auto mt-2 h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedServicio}
                className="w-full sm:w-auto"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Barbero */}
        {step === 2 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Selecciona tu barbero</h2>
            <div className="grid gap-3">
              {barberosActivos.map((barbero) => (
                <Card
                  key={barbero.id}
                  className={`cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:ring-4 hover:ring-primary/30 hover:bg-primary/5 ${
                    selectedBarbero === barbero.id
                      ? "border-primary ring-4 ring-primary/30 bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedBarbero(barbero.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                      {barbero.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{barbero.nombre}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {barbero.especialidades.slice(0, 3).map((esp) => (
                          <span
                            key={esp}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {esp}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span>{barbero.estadisticas.calificacionPromedio}</span>
                        <span className="text-muted-foreground/60">
                          ({barbero.estadisticas.clientesAtendidos} clientes)
                        </span>
                      </div>
                    </div>
                    {selectedBarbero === barbero.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 sm:flex-none">
                Atras
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedBarbero}
                className="flex-1 sm:flex-none sm:ml-auto"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Seleccionar Fecha y Hora */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Selecciona fecha y hora</h2>
            
            {/* Fecha */}
            <div className="mb-6">
              <Label className="mb-3 block text-sm font-medium">Fecha</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {fechasDisponibles.map((fecha) => (
                  <button
                    key={fecha.value}
                    onClick={() => setSelectedFecha(fecha.value)}
                    className={`flex min-w-[80px] flex-col items-center rounded-lg border p-3 transition-all ${
                      selectedFecha === fecha.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span className="text-xs uppercase">{fecha.label.split(' ')[0]}</span>
                    <span className="text-lg font-bold">{fecha.label.split(' ')[1]}</span>
                    <span className="text-xs">{fecha.label.split(' ')[2]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hora */}
            {selectedFecha && (
              <div>
                <Label className="mb-3 block text-sm font-medium">Hora disponible</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {horariosDisponibles.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => setSelectedHora(hora)}
                      className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                        selectedHora === hora
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary"
                      }`}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 sm:flex-none">
                Atras
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!selectedFecha || !selectedHora}
                className="flex-1 sm:flex-none sm:ml-auto"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Datos del Cliente */}
        {step === 4 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Completa tus datos</h2>
            
            {/* Resumen de la reserva */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="container mx-auto px-4 py-8">
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 lg:h-[28rem]">
                      <img
                        src={carouselImages[currentSlide].url}
                        alt={carouselImages[currentSlide].alt}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                      <button
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3 overflow-x-auto py-2">
                      {carouselImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`flex-shrink-0 h-20 w-28 overflow-hidden rounded-lg border transition-shadow duration-150 focus:outline-none ${
                            currentSlide === i
                              ? 'ring-2 ring-primary/60 shadow-md border-transparent'
                              : 'border-border hover:shadow-sm'
                          }`}
                        >
                          <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  </div>
                </CardHeader>

                <CardContent>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="nombre">Nombre</Label>
                            <Input
                              id="nombre"
                              placeholder="Ej: Juan Perez"
                              value={clienteData.nombre}
                              onChange={(e) => setClienteData({ ...clienteData, nombre: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                              id="telefono"
                              placeholder="+54 11 1234-5678"
                              value={clienteData.telefono}
                              onChange={(e) => setClienteData({ ...clienteData, telefono: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email (opcional)</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="tu@email.com"
                              value={clienteData.email}
                              onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 sm:flex-none">
                Atras
              </Button>
              <Button
                onClick={handleConfirmarReserva}
                disabled={!clienteData.nombre || !clienteData.telefono}
                className="flex-1 sm:flex-none sm:ml-auto"
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold text-foreground">{infoBarberia.nombre}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {infoBarberia.direccion}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {infoBarberia.telefono}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-foreground">Horarios</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Lunes a Viernes: {infoBarberia.horarios.lunesViernes}</p>
                <p>Sabado: {infoBarberia.horarios.sabado}</p>
                <p>Domingo: {infoBarberia.horarios.domingo}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-border pt-6">
            <a
              href={`https://instagram.com/${infoBarberia.redesSociales.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Camera className="h-5 w-5" />
            </a>
            <a
              href={`https://wa.me/${infoBarberia.redesSociales.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modal de Confirmacion */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-center">Reserva Confirmada</DialogTitle>
            <DialogDescription className="text-center">
              Tu turno ha sido reservado exitosamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicio:</span>
              <span className="font-medium">{servicio?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Barbero:</span>
              <span className="font-medium">{barbero?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">
                {selectedFecha && new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora:</span>
              <span className="font-medium">{selectedHora} hs</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Te enviaremos un recordatorio por WhatsApp
          </p>
          <Button onClick={resetReserva} className="w-full">
            Hacer otra reserva
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
