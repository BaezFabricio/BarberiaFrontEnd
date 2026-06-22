"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Phone, Camera, MessageCircle, Check, ChevronRight, ChevronLeft, Scissors, Star, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'

function getSubdominio(): string | null {
  if (typeof window === 'undefined') return null
  const parts = window.location.hostname.split('.')
  if (parts.length >= 3) return parts[0]
  return process.env.NEXT_PUBLIC_DEV_SUBDOMINIO ?? null
}

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/public${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor')
  return data as T
}

type Servicio = { idservicio: number; nombre_servicio: string; descripcion: string; precio: number; duracion_minutos: number; imagen_url?: string | null }
type Barbero = { idusuario: number; rating_promedio: number; nombre_completo: string; foto_url?: string | null }
type BarberiaPub = { nombre_negocio: string; subdominio: string; logo_url?: string | null; servicios: Servicio[]; barberos: Barbero[] }

const carouselImages = [
  { url: "/images/barberia-1.jpg", alt: "Interior" },
  { url: "/images/barberia-2.jpg", alt: "Corte" },
  { url: "/images/barberia-3.jpg", alt: "Barba" },
]

export default function ReservasPublicas() {
  const [step, setStep] = useState(1)
  const [logoAvailable, setLogoAvailable] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [subdominio, setSubdominio] = useState<string | null>(null)
  const [barberia, setBarberia] = useState<BarberiaPub | null>(null)
  const [loadingBarberia, setLoadingBarberia] = useState(true)
  const [errorBarberia, setErrorBarberia] = useState('')

  const [selectedServicio, setSelectedServicio] = useState<number | null>(null)
  const [selectedBarbero, setSelectedBarbero] = useState<number | null>(null)
  const [selectedFecha, setSelectedFecha] = useState('')
  const [selectedHora, setSelectedHora] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clienteData, setClienteData] = useState({ nombre: '', telefono: '', email: '' })

  const [enviando, setEnviando] = useState(false)
  const [errorReserva, setErrorReserva] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [reservaConfirmada, setReservaConfirmada] = useState<{ fecha: string; hora_inicio: string; servicio: string } | null>(null)

  // Cargar datos de la barbería al montar
  useEffect(() => {
    aplicarColorGuardado()
    const sub = getSubdominio()
    setSubdominio(sub)
    if (!sub) { setLoadingBarberia(false); setErrorBarberia('No se pudo determinar la barbería'); return }
    publicFetch<BarberiaPub>(`/barberia?subdominio=${sub}`)
      .then(data => { setBarberia(data); setLoadingBarberia(false); if (data.color_primario) aplicarColor(data.color_primario, true) })
      .catch(err => { setErrorBarberia(err.message); setLoadingBarberia(false) })
  }, [])

  // Carrusel automático
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % carouselImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  // Cargar slots cuando cambian barbero, fecha o servicio
  useEffect(() => {
    if (!selectedBarbero || !selectedFecha || !selectedServicio || !subdominio) return
    setLoadingSlots(true)
    setSelectedHora(null)
    setSlots([])
    publicFetch<{ slots: string[] }>(
      `/disponibilidad?subdominio=${subdominio}&barbero_id=${selectedBarbero}&fecha=${selectedFecha}&idservicio=${selectedServicio}`
    )
      .then(d => { setSlots(d.slots); setLoadingSlots(false) })
      .catch(() => { setSlots([]); setLoadingSlots(false) })
  }, [selectedBarbero, selectedFecha, selectedServicio, subdominio])

  const handleConfirmarReserva = async () => {
    if (!subdominio || !selectedServicio || !selectedBarbero || !selectedFecha || !selectedHora) return
    setEnviando(true)
    setErrorReserva('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/reserva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdominio,
          idservicio: selectedServicio,
          idusuario_barbero: selectedBarbero,
          fecha: selectedFecha,
          hora_inicio: selectedHora,
          nombre_cliente: clienteData.nombre,
          telefono_cliente: clienteData.telefono,
          correo_electronico: clienteData.email || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al reservar')
      setReservaConfirmada(data)
      setShowConfirmation(true)
    } catch (err: unknown) {
      setErrorReserva(err instanceof Error ? err.message : 'Error al reservar')
    } finally {
      setEnviando(false)
    }
  }

  const resetReserva = () => {
    setStep(1); setSelectedServicio(null); setSelectedBarbero(null)
    setSelectedFecha(''); setSelectedHora(null); setSlots([])
    setClienteData({ nombre: '', telefono: '', email: '' })
    setErrorReserva(''); setShowConfirmation(false); setReservaConfirmada(null)
  }

  const fechasDisponibles = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return {
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayName: d.toLocaleDateString('es-AR', { weekday: 'long' }),
    }
  }).filter(d => d.dayName !== 'domingo')

  const servicioSeleccionado = barberia?.servicios.find(s => s.idservicio === selectedServicio)
  const barberoSeleccionado = barberia?.barberos.find(b => b.idusuario === selectedBarbero)
  const nombreBarberia = barberia?.nombre_negocio ?? 'Barbería'

  if (loadingBarberia) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (errorBarberia || !barberia) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="size-12 text-destructive" />
        <h1 className="text-xl font-semibold">Barbería no encontrada</h1>
        <p className="text-muted-foreground">{errorBarberia}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 items-center justify-center">
              {barberia?.logo_url ? (
                <img src={barberia.logo_url} alt={nombreBarberia} className="h-10 w-auto max-w-[120px] object-contain" />
              ) : (
                <Scissors className="h-5 w-5 text-primary" />
              )}
            </div>
            <span className="text-xl font-bold text-foreground">
              <span>{nombreBarberia.split(' ')[0]} </span>
              <span className="text-primary">{nombreBarberia.split(' ').slice(1).join(' ')}</span>
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Portada */}
      <section className="relative w-full px-2 pt-2">
        <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-3 md:gap-0 md:rounded-[1.5rem]">
          {carouselImages.map((img, i) => (
            <a key={i} href="#seleccion-servicio" aria-label="Ir a reservar"
              className="group relative aspect-[16/10] overflow-hidden bg-black transition-shadow duration-300 rounded-2xl md:aspect-[4/5]">
              <img src={img.url} alt={img.alt} className="absolute inset-0 h-full w-full object-cover brightness-100 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-black/10 to-transparent" />
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="container mx-auto flex justify-center px-4 py-6">
          <a href="#seleccion-servicio"
            className="group w-fit rounded-2xl px-6 py-4 text-center backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{
              border: '1px solid rgba(var(--primary-rgb),0.55)',
              background: 'linear-gradient(to bottom, rgba(var(--primary-rgb),0.12), rgba(var(--primary-rgb),0.06))',
              boxShadow: '0 0 0 1px rgba(var(--primary-rgb),0.2), 0 16px 40px rgba(var(--primary-rgb),0.18)',
            }}>
            <h2 className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">
              Reserva tu turno
            </h2>
          </a>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 4 && <div className={`mx-2 h-0.5 w-8 transition-colors sm:w-12 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground sm:gap-8">
            {['Servicio', 'Barbero', 'Fecha', 'Datos'].map((label, i) => (
              <span key={label} className={step >= i + 1 ? 'text-primary' : ''}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Step 1: Servicio */}
        {step === 1 && (
          <div id="seleccion-servicio" className="mx-auto max-w-2xl scroll-mt-24">
            <h2 className="mb-6 text-xl font-semibold">Selecciona un servicio</h2>
            <div className="grid gap-3">
              {barberia.servicios.map(s => (
                <Card key={s.idservicio} onClick={() => setSelectedServicio(s.idservicio)}
                  className={`cursor-pointer border-2 transition-all hover:border-primary ${selectedServicio === s.idservicio ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-transparent'}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {s.imagen_url && (
                      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl">
                        <img src={s.imagen_url} alt={s.nombre_servicio} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{s.nombre_servicio}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{s.descripcion}</p>
                        <span className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />{s.duracion_minutos} min
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-primary">${Number(s.precio).toLocaleString('es-AR')}</p>
                        {selectedServicio === s.idservicio && <Check className="ml-auto mt-2 h-5 w-5 text-primary" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!selectedServicio} className="w-full sm:w-auto">
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Barbero */}
        {step === 2 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Selecciona tu barbero</h2>
            <div className="grid gap-3">
              {barberia.barberos.map(b => (
                <Card key={b.idusuario} onClick={() => setSelectedBarbero(b.idusuario)}
                  className={`cursor-pointer border-2 transition-all hover:border-primary hover:bg-primary/5 ${selectedBarbero === b.idusuario ? 'border-primary ring-4 ring-primary/30 bg-primary/5' : 'border-transparent'}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary">
                      {b.foto_url
                        ? <img src={b.foto_url} alt={b.nombre_completo} className="h-14 w-14 object-cover" />
                        : b.nombre_completo.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                      }
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{b.nombre_completo}</h3>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span>{Number(b.rating_promedio).toFixed(1)}</span>
                      </div>
                    </div>
                    {selectedBarbero === b.idusuario && <Check className="h-5 w-5 text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 sm:flex-none">Atrás</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedBarbero} className="flex-1 sm:flex-none sm:ml-auto">
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Fecha y Hora */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Selecciona fecha y hora</h2>
            <div className="mb-6">
              <Label className="mb-3 block text-sm font-medium">Fecha</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {fechasDisponibles.map(f => (
                  <button key={f.value} onClick={() => setSelectedFecha(f.value)}
                    className={`flex min-w-[80px] flex-col items-center rounded-lg border p-3 transition-all ${selectedFecha === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>
                    <span className="text-xs uppercase">{f.label.split(' ')[0]}</span>
                    <span className="text-lg font-bold">{f.label.split(' ')[1]}</span>
                    <span className="text-xs">{f.label.split(' ')[2]}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedFecha && (
              <div>
                <Label className="mb-3 block text-sm font-medium">Horario disponible</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-6 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Cargando horarios...
                  </div>
                ) : slots.length === 0 ? (
                  <p className="py-6 text-muted-foreground">No hay horarios disponibles para este día.</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: ' Mañana', desde: 0,  hasta: 12 },
                      { label: ' Tarde',  desde: 12, hasta: 18 },
                      { label: ' Noche',  desde: 18, hasta: 24 },
                    ].map(({ label, desde, hasta }) => {
                      const grupo = slots.filter(h => { const hr = Number(h.split(':')[0]); return hr >= desde && hr < hasta })
                      if (grupo.length === 0) return null
                      return (
                        <div key={label}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                            {grupo.map(hora => (
                              <button key={hora} onClick={() => setSelectedHora(hora)}
                                className={`rounded-lg border p-3 text-sm font-medium transition-all ${selectedHora === hora ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>
                                {hora}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 sm:flex-none">Atrás</Button>
              <Button onClick={() => setStep(4)} disabled={!selectedFecha || !selectedHora} className="flex-1 sm:flex-none sm:ml-auto">
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Datos del cliente */}
        {step === 4 && (
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold">Completa tus datos</h2>

            {/* Resumen */}
            <Card className="mb-6">
              <CardContent className="grid gap-2 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Servicio:</span><span className="font-medium">{servicioSeleccionado?.nombre_servicio}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Barbero:</span><span className="font-medium">{barberoSeleccionado?.nombre_completo}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{selectedFecha && new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Hora:</span><span className="font-medium">{selectedHora} hs</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Precio:</span><span className="font-bold text-primary">${Number(servicioSeleccionado?.precio ?? 0).toLocaleString('es-AR')}</span></div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" placeholder="Ej: Juan Perez" value={clienteData.nombre}
                  onChange={e => setClienteData(p => ({ ...p, nombre: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input id="telefono" placeholder="+54 11 1234-5678" value={clienteData.telefono}
                  onChange={e => setClienteData(p => ({ ...p, telefono: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input id="email" type="email" placeholder="tu@email.com" value={clienteData.email}
                  onChange={e => setClienteData(p => ({ ...p, email: e.target.value }))} className="mt-1.5" />
              </div>
            </div>

            {errorReserva && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />{errorReserva}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 sm:flex-none">Atrás</Button>
              <Button onClick={handleConfirmarReserva}
                disabled={!clienteData.nombre || !clienteData.telefono || enviando}
                className="flex-1 sm:flex-none sm:ml-auto">
                {enviando ? <><Loader2 className="mr-2 size-4 animate-spin" />Reservando...</> : 'Confirmar Reserva'}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 text-center">
            <h3 className="font-semibold text-foreground">{nombreBarberia}</h3>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-border pt-6 text-muted-foreground">
            <span className="text-sm">Powered by BarberSaaS</span>
          </div>
        </div>
      </footer>

      {/* Modal Confirmación */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-center">¡Turno Reservado!</DialogTitle>
            <DialogDescription className="text-center">Tu turno fue confirmado exitosamente</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicio:</span>
              <span className="font-medium">{reservaConfirmada?.servicio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">
                {reservaConfirmada?.fecha && new Date(reservaConfirmada.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora:</span>
              <span className="font-medium">{reservaConfirmada?.hora_inicio} hs</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">Te esperamos en la barbería</p>
          <Button onClick={resetReserva} className="w-full">Hacer otra reserva</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
