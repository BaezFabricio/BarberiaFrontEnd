"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar, Clock, MapPin, Phone, MessageCircle,
  Check, ChevronRight, Scissors, Star, Loader2, AlertCircle,
  ChevronDown, Images
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { aplicarColor, aplicarColorGuardado } from '@/lib/theme'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

function getSubdominio(): string | null {
  if (process.env.NEXT_PUBLIC_SINGLE_TENANT === 'true') return null
  if (typeof window === 'undefined') return null
  const parts = window.location.hostname.split('.')
  if (parts.length >= 3 && !parts.slice(-2).join('.').match(/vercel\.app|localhost/)) return parts[0]
  const params = new URLSearchParams(window.location.search)
  const b = params.get('b')
  if (b) return b
  return process.env.NEXT_PUBLIC_DEV_SUBDOMINIO ?? null
}

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/api/public${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor')
  return data as T
}

type Servicio = { idservicio: number; nombre_servicio: string; descripcion: string; precio: number; duracion_minutos: number; imagen_url?: string | null }
type Barbero = { idusuario: number; rating_promedio: number; nombre_completo: string; foto_url?: string | null; especialidades?: string | null }
type BarberiaPub = {
  nombre_negocio: string; subdominio: string; logo_url?: string | null; color_primario?: string
  telefono?: string | null; direccion?: string | null; correo_negocio?: string | null
  horario_lv_desde?: string; horario_lv_hasta?: string; horario_sab_desde?: string; horario_sab_hasta?: string; domingo_cerrado?: boolean
  instagram?: string | null; facebook?: string | null; whatsapp_negocio?: string | null
  reservas_online?: boolean; slogan?: string | null; descripcion?: string | null
  color_portada?: string | null; color_nombre_1?: string | null; color_nombre_2?: string | null
  texto_portada_1?: string | null; texto_portada_2?: string | null
  color_header_1?: string | null; color_header_2?: string | null; fuente_header?: string | null
  maps_embed?: string | null; tiempo_cancelacion?: number
  servicios: Servicio[]; barberos: Barbero[]
}

const FALLBACK_IMAGES = [{ url: "/images/barberia-1.jpg" }, { url: "/images/barberia-2.jpg" }, { url: "/images/barberia-3.jpg" }]
const FONT_MAP: Record<string, string> = { 'Cinzel': 'cinzel', 'Playfair Display': 'playfair', 'Oswald': 'oswald', 'Bebas Neue': 'bebas', 'Abril Fatface': 'abril' }

export default function Landing() {
  const router = useRouter()
  const reservaRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(1)
  const [carouselImages, setCarouselImages] = useState<{ url: string }[]>([])
  const [galeriaImages, setGaleriaImages] = useState<{ idimagen: number; url: string }[]>([])
  const [galeriaExpandida, setGaleriaExpandida] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
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
  const [sinHorarios, setSinHorarios] = useState(false)
  const [clienteData, setClienteData] = useState({ nombre: '', telefono: '', email: '' })

  const [enviando, setEnviando] = useState(false)
  const [errorReserva, setErrorReserva] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [reservaConfirmada, setReservaConfirmada] = useState<{ fecha: string; hora_inicio: string; servicio: string; barbero?: string; precio?: number; nombre?: string } | null>(null)

  // Rating
  type RatingBarbero = { idusuario: number; nombre_completo: string; foto_url?: string | null }
  const [ratingBarbero, setRatingBarbero] = useState<RatingBarbero | null>(null)
  const [ratingEstrellas, setRatingEstrellas] = useState(0)
  const [ratingHover, setRatingHover] = useState(0)
  const [ratingComentario, setRatingComentario] = useState('')
  const [ratingNombre, setRatingNombre] = useState('')
  const [enviandoRating, setEnviandoRating] = useState(false)
  const [ratingEnviado, setRatingEnviado] = useState(false)

  // Carousel auto-advance
  useEffect(() => {
    if (carouselImages.length <= 1) return
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % carouselImages.length), 5000)
    return () => clearInterval(t)
  }, [carouselImages.length])

  useEffect(() => {
    aplicarColorGuardado()
    const sub = getSubdominio()
    setSubdominio(sub)
    if (!sub && process.env.NEXT_PUBLIC_SINGLE_TENANT !== 'true') { router.push('/login'); return }

    const qb = sub ? `/barberia?subdominio=${sub}` : '/barberia'
    publicFetch<BarberiaPub>(qb)
      .then(data => { setBarberia(data); setLoadingBarberia(false); if (data.color_primario) aplicarColor(data.color_primario, true) })
      .catch(err => { setErrorBarberia(err.message); setLoadingBarberia(false) })

    const qc = sub ? `/carrusel?subdominio=${sub}` : '/carrusel'
    publicFetch<{ idimagen: number; url: string }[]>(qc)
      .then(imgs => setCarouselImages(imgs.length > 0 ? imgs : FALLBACK_IMAGES))
      .catch(() => setCarouselImages(FALLBACK_IMAGES))

    const qg = sub ? `/galeria?subdominio=${sub}` : '/galeria'
    publicFetch<{ idimagen: number; url: string }[]>(qg)
      .then(imgs => setGaleriaImages(imgs))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBarbero || !selectedFecha || !selectedServicio) return
    setLoadingSlots(true); setSelectedHora(null); setSlots([]); setSinHorarios(false)
    const subParam = subdominio ? `subdominio=${subdominio}&` : ''
    publicFetch<{ slots: string[]; sin_horarios?: boolean }>(
      `/disponibilidad?${subParam}barbero_id=${selectedBarbero}&fecha=${selectedFecha}&idservicio=${selectedServicio}`
    )
      .then(d => { setSlots(d.slots); setSinHorarios(d.slots.length === 0); setLoadingSlots(false) })
      .catch(() => { setSlots([]); setSinHorarios(false); setLoadingSlots(false) })
  }, [selectedBarbero, selectedFecha, selectedServicio, subdominio])

  const handleConfirmarReserva = async () => {
    if (!selectedServicio || !selectedBarbero || !selectedFecha || !selectedHora) return
    setEnviando(true); setErrorReserva('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/public/reserva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(subdominio ? { subdominio } : {}),
          idservicio: selectedServicio, idusuario_barbero: selectedBarbero,
          fecha: selectedFecha, hora_inicio: selectedHora,
          nombre_cliente: clienteData.nombre, telefono_cliente: clienteData.telefono,
          correo_electronico: clienteData.email || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al reservar')
      setReservaConfirmada({ ...data, barbero: barberoSeleccionado?.nombre_completo, precio: servicioSeleccionado?.precio, nombre: clienteData.nombre })
      setShowConfirmation(true)
    } catch (err: unknown) {
      setErrorReserva(err instanceof Error ? err.message : 'Error al reservar')
    } finally { setEnviando(false) }
  }

  const resetReserva = () => {
    setStep(1); setSelectedServicio(null); setSelectedBarbero(null)
    setSelectedFecha(''); setSelectedHora(null); setSlots([])
    setClienteData({ nombre: '', telefono: '', email: '' })
    setErrorReserva(''); setShowConfirmation(false); setReservaConfirmada(null)
  }

  const fechasDisponibles = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { value: d.toISOString().split('T')[0], label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }), dayName: d.toLocaleDateString('es-AR', { weekday: 'long' }) }
  }).filter(d => d.dayName !== 'domingo')

  const servicioSeleccionado = barberia?.servicios.find(s => s.idservicio === selectedServicio)
  const barberoSeleccionado = barberia?.barberos.find(b => b.idusuario === selectedBarbero)
  const nombreBarberia = barberia?.nombre_negocio ?? 'Barbería'
  const headerFont = barberia?.fuente_header && barberia.fuente_header !== 'inherit'
    ? `var(--font-${FONT_MAP[barberia.fuente_header] ?? 'cinzel'}), serif`
    : undefined

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

  if (barberia.reservas_online === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <Scissors className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{barberia.nombre_negocio}</h1>
          <p className="text-muted-foreground max-w-sm">Las reservas online están temporalmente deshabilitadas.</p>
          <p className="text-sm text-muted-foreground">Para sacar turno, contactanos directamente:</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {barberia.whatsapp_negocio && (
            <a href={`https://wa.me/${barberia.whatsapp_negocio.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-3 text-sm font-medium transition-colors">
              WhatsApp
            </a>
          )}
          {barberia.telefono && (
            <a href={`tel:${barberia.telefono}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-border hover:bg-muted px-4 py-3 text-sm font-medium transition-colors">
              {barberia.telefono}
            </a>
          )}
        </div>
      </div>
    )
  }

  const heroBg = carouselImages[carouselIdx]?.url

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            {barberia.logo_url && (
              <img src={barberia.logo_url} alt={nombreBarberia} className="h-9 w-auto max-w-[44px] object-contain" />
            )}
            <span className="font-bold text-lg leading-tight truncate text-white" style={{ fontFamily: headerFont }}>
              {nombreBarberia.split(' ').map((p, i) => (
                <span key={i} style={{ color: i === 0 ? (barberia.color_header_1 ?? 'white') : (barberia.color_header_2 ?? barberia.color_header_1 ?? 'white') }}>
                  {i > 0 ? ' ' : ''}{p}
                </span>
              ))}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
              <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
              <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
              <a href="#equipo" className="hover:text-white transition-colors">Equipo</a>
              <a href="#reserva" className="hover:text-white transition-colors">Reservar</a>
            </nav>
            <ThemeToggle />
            <Button size="sm" onClick={() => reservaRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden sm:inline-flex">
              Reservar turno
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Background image carousel */}
        {carouselImages.map((img, idx) => (
          <div key={img.url} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: idx === carouselIdx ? 1 : 0 }}>
            <img src={img.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          {barberia.logo_url && (
            <img src={barberia.logo_url} alt={nombreBarberia} className="h-20 w-auto max-w-[80px] object-contain drop-shadow-2xl" />
          )}
          <div>
            <h1 className="text-5xl font-black leading-none tracking-tight text-white sm:text-7xl" style={{ fontFamily: headerFont }}>
              {nombreBarberia.split(' ').map((p, i) => (
                <span key={i} style={{ color: i === 0 ? (barberia.color_header_1 ?? 'white') : (barberia.color_header_2 ?? barberia.color_header_1 ?? 'white') }}>
                  {i > 0 ? ' ' : ''}{p}
                </span>
              ))}
            </h1>
            {barberia.slogan && (
              <p className="mt-3 text-lg text-white/70 italic">{barberia.slogan}</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={() => reservaRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-xl px-8 py-4 text-base font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                boxShadow: '0 8px 32px rgba(var(--primary-rgb),0.4)',
              }}>
              Reservar turno
            </button>
            {barberia.whatsapp_negocio && (
              <a href={`https://wa.me/${barberia.whatsapp_negocio.replace(/\D/g,'')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
          </div>

          {/* Indicadores carousel */}
          {carouselImages.length > 1 && (
            <div className="flex gap-1.5">
              {carouselImages.map((_, i) => (
                <button key={i} onClick={() => setCarouselIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <ChevronDown className="size-6" />
        </div>
      </section>

      {/* ── VENTAJAS ── */}
      <section className="border-b border-border bg-card/40 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Calendar, title: 'Reserva online', desc: 'Sacá tu turno en menos de 2 minutos, sin llamadas.' },
              { icon: Clock, title: 'Sin esperas', desc: 'Tu turno confirmado, llegás y te atendemos.' },
              { icon: Star, title: 'Calidad garantizada', desc: 'Barberos profesionales con años de experiencia.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 rounded-xl p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HORARIOS ── */}
      <section className="bg-primary py-5 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-medium">
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 opacity-70" />
              <span className="opacity-70">Lun – Vie</span>
              <span className="font-bold">{barberia.horario_lv_desde ?? '09:00'} – {barberia.horario_lv_hasta ?? '19:00'} hs</span>
            </div>
            <div className="hidden md:block h-5 w-px bg-primary-foreground/20" />
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 opacity-70" />
              <span className="opacity-70">Sábado</span>
              <span className="font-bold">{barberia.horario_sab_desde ?? '09:00'} – {barberia.horario_sab_hasta ?? '15:00'} hs</span>
            </div>
            <div className="hidden md:block h-5 w-px bg-primary-foreground/20" />
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 opacity-70" />
              <span className="opacity-70">Domingo</span>
              <span className="font-bold">{barberia.domingo_cerrado ? 'Cerrado' : 'Abierto'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOBRE NOSOTROS ── */}
      {barberia.descripcion && (
        <section id="nosotros" className="py-14 scroll-mt-16">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Label */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest mb-8">
              <Scissors className="size-3" /> Quiénes somos
            </div>

            {/* Layout horizontal: texto izquierda, stats derecha */}
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Texto */}
              <div className="flex-1 space-y-3">
                <h2 className="text-3xl font-black tracking-tight leading-tight">{barberia.nombre_negocio}</h2>
                <p className="text-muted-foreground leading-relaxed max-w-prose">{barberia.descripcion}</p>
              </div>

              {/* Stats en columna */}
              <div className="flex flex-row md:flex-col gap-3 shrink-0 flex-wrap">
                {[
                  { valor: barberia.barberos.length, label: 'Barberos' },
                  { valor: barberia.servicios.length, label: 'Servicios' },
                  { valor: '100%', label: 'Satisfacción' },
                  { valor: 'Online', label: 'Reservas' },
                ].map(({ valor, label }) => (
                  <div key={label} className="rounded-2xl border border-border bg-card px-5 py-4 text-center min-w-[90px]">
                    <p className="text-2xl font-black text-primary">{valor}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICIOS ── */}
      {barberia.servicios.length > 0 && (
        <section id="servicios" className="py-16 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black tracking-tight">Nuestros servicios</h2>
              <p className="mt-2 text-muted-foreground">Todo lo que necesitás para verte impecable</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {barberia.servicios.map(s => (
                <div key={s.idservicio}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/40">
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    {s.imagen_url
                      ? <img src={s.imagen_url} alt={s.nombre_servicio} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center"><Scissors className="size-10 text-muted-foreground/30" /></div>
                    }
                    <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {s.duracion_minutos} min
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base">{s.nombre_servicio}</h3>
                    {s.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.descripcion}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xl font-black text-primary">${Number(s.precio).toLocaleString('es-AR')}</span>
                      <button
                        onClick={() => {
                          setSelectedServicio(s.idservicio)
                          setSelectedBarbero(null)
                          setSelectedFecha('')
                          setSelectedHora(null)
                          setSlots([])
                          setErrorReserva('')
                          setStep(2)
                          setTimeout(() => reservaRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
                        }}
                        className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EQUIPO ── */}
      {barberia.barberos.length > 0 && (
        <section id="equipo" className="py-16 bg-card/30 scroll-mt-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black tracking-tight">Nuestro equipo</h2>
              <p className="mt-2 text-muted-foreground">Profesionales apasionados por su oficio</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              {barberia.barberos.map(b => {
                const initials = b.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={b.idusuario} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center w-44 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/40">
                    <div className="relative size-20 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10">
                      {b.foto_url
                        ? <img src={b.foto_url} alt={b.nombre_completo} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-xl font-bold text-primary">{initials}</div>
                      }
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <h3 className="font-bold text-sm leading-tight">{b.nombre_completo}</h3>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Star className="size-3 fill-primary text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {b.rating_promedio > 0 ? Number(b.rating_promedio).toFixed(1) : 'Nuevo'}
                        </span>
                      </div>
                      {b.especialidades && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{b.especialidades}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setRatingBarbero(b)
                        setRatingEstrellas(0)
                        setRatingHover(0)
                        setRatingComentario('')
                        setRatingNombre('')
                        setRatingEnviado(false)
                      }}
                      className="mt-1 w-full rounded-lg border border-primary/30 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      ⭐ Calificar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── GALERÍA ── */}
      {galeriaImages.length > 0 && (
        <section className="py-16 bg-card/30">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Header siempre visible */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
                  <Images className="size-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Nuestro trabajo</h2>
              </div>
              <button
                onClick={() => setGaleriaExpandida(e => !e)}
                className="flex items-center justify-center size-8 text-primary hover:opacity-70 transition-opacity"
                aria-label={galeriaExpandida ? 'Ver menos' : 'Ver fotos'}
              >
                <ChevronDown className={`size-5 transition-transform duration-350 ${galeriaExpandida ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Abanico — comprimido */}
            {!galeriaExpandida && (
              <div
                className="relative mx-auto cursor-pointer"
                style={{ height: '290px', width: '100%', maxWidth: '500px' }}
                onClick={() => setGaleriaExpandida(true)}
              >
                {galeriaImages.slice(0, 5).map((img, i) => {
                  const rotations = [-28, -14, 0, 14, 28]
                  const translateX = [-80, -40, 0, 40, 80]
                  return (
                    <div
                      key={img.idimagen}
                      className="absolute overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                      style={{
                        width: '130px',
                        height: '190px',
                        bottom: 0,
                        left: '50%',
                        transformOrigin: 'bottom center',
                        transform: `translateX(calc(-50% + ${translateX[i]}px)) rotate(${rotations[i]}deg)`,
                        zIndex: i === 2 ? 5 : i < 2 ? i + 1 : 5 - i,
                        transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)',
                      }}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tira horizontal — expandido */}
            {galeriaExpandida && (
              <div
                className="overflow-x-auto pb-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--primary)) transparent' }}
              >
                <div className="flex gap-2.5" style={{ width: 'max-content' }}>
                  {galeriaImages.map((img, i) => (
                    <div
                      key={img.idimagen}
                      className="shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] group"
                      style={{
                        width: '160px',
                        height: '210px',
                        animation: `slideInH 0.4s cubic-bezier(.4,0,.2,1) both`,
                        animationDelay: `${i * 55}ms`,
                      }}
                    >
                      <img src={img.url} alt="Trabajo de barbería" className="h-full w-full object-cover transition-transform duration-400 group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <style>{`
        @keyframes slideInH {
          from { opacity: 0; transform: translateX(28px) scale(.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      {/* ── RESERVA ── */}
      <section id="reserva" ref={reservaRef} className="py-16 scroll-mt-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tight">Reservar turno</h2>
            <p className="mt-2 text-muted-foreground">Elegí servicio, barbero y horario en segundos</p>
          </div>

          {/* Steps indicator */}
          <div className="mb-10 flex items-center justify-center gap-2">
            {['Servicio', 'Barbero', 'Fecha y hora', 'Tus datos'].map((label, i) => {
              const s = i + 1
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-all ${step > s ? 'bg-primary text-primary-foreground' : step === s ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'}`}>
                      {step > s ? <Check className="size-4" /> : s}
                    </div>
                    <span className={`hidden sm:block text-xs font-medium ${step >= s ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                  </div>
                  {s < 4 && <div className={`mx-2 mb-4 h-0.5 w-8 sm:w-16 transition-colors ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              )
            })}
          </div>

          <div className="mx-auto max-w-2xl">

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                {barberia.servicios.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">No hay servicios disponibles por el momento.</p>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {barberia.servicios.map(s => (
                        <div key={s.idservicio} onClick={() => setSelectedServicio(s.idservicio)}
                          className={`flex cursor-pointer overflow-hidden rounded-2xl border-2 transition-all h-28 ${selectedServicio === s.idservicio ? 'border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] bg-primary/5' : 'border-border hover:border-primary/50 bg-card'}`}>
                          <div className="relative w-28 shrink-0 bg-muted">
                            {s.imagen_url
                              ? <img src={s.imagen_url} alt={s.nombre_servicio} className="h-full w-full object-cover" />
                              : <div className="flex h-full items-center justify-center"><Scissors className="size-7 text-muted-foreground/30" /></div>
                            }
                          </div>
                          <div className="flex flex-1 items-center justify-between p-4">
                            <div>
                              <h3 className="font-bold">{s.nombre_servicio}</h3>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{s.duracion_minutos} min</p>
                              {s.descripcion && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.descripcion}</p>}
                            </div>
                            <div className="shrink-0 pl-4 text-right">
                              <p className="text-lg font-black text-primary">${Number(s.precio).toLocaleString('es-AR')}</p>
                              {selectedServicio === s.idservicio && <Check className="ml-auto mt-1 size-4 text-primary" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setStep(2)} disabled={!selectedServicio} size="lg">
                        Continuar <ChevronRight className="ml-1 size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                {servicioSeleccionado && (
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Servicio seleccionado:</span>
                    <div className="flex items-center gap-3 font-semibold">
                      {servicioSeleccionado.nombre_servicio}
                      <button onClick={() => setStep(1)} className="text-xs text-primary underline underline-offset-2">cambiar</button>
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  {barberia.barberos.map(b => (
                    <Card key={b.idusuario} onClick={() => setSelectedBarbero(b.idusuario)}
                      className={`cursor-pointer border-2 transition-all ${selectedBarbero === b.idusuario ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]' : 'border-border hover:border-primary/50'}`}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="size-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                          {b.foto_url
                            ? <img src={b.foto_url} alt={b.nombre_completo} className="size-14 object-cover" />
                            : b.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)
                          }
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{b.nombre_completo}</h3>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Star className="size-3.5 fill-primary text-primary" />
                            <span>{Number(b.rating_promedio).toFixed(1)}</span>
                          </div>
                          {b.especialidades && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {b.especialidades.split(',').map(e => e.trim()).filter(Boolean).map(esp => (
                                <span key={esp} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{esp}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedBarbero === b.idusuario && <Check className="size-5 shrink-0 text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
                  <Button onClick={() => setStep(3)} disabled={!selectedBarbero} size="lg">
                    Continuar <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block font-semibold">Elegí una fecha</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {fechasDisponibles.map(f => (
                      <button key={f.value} onClick={() => setSelectedFecha(f.value)}
                        className={`flex min-w-[76px] flex-col items-center rounded-xl border p-3 transition-all ${selectedFecha === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>
                        <span className="text-xs uppercase font-medium">{f.label.split(' ')[0]}</span>
                        <span className="text-xl font-black">{f.label.split(' ')[1]}</span>
                        <span className="text-xs">{f.label.split(' ')[2]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedFecha && (
                  <div>
                    <Label className="mb-3 block font-semibold">Elegí un horario</Label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando horarios...</div>
                    ) : slots.length === 0 ? (
                      <div className="rounded-xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                        {sinHorarios ? 'Este barbero no trabaja este día. Probá con otro día u otro barbero.' : 'No hay turnos disponibles. Probá con otra fecha.'}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[{ label: 'Mañana', desde: 0, hasta: 12 }, { label: 'Tarde', desde: 12, hasta: 18 }, { label: 'Noche', desde: 18, hasta: 24 }].map(({ label, desde, hasta }) => {
                          const grupo = slots.filter(h => { const hr = Number(h.split(':')[0]); return hr >= desde && hr < hasta })
                          if (!grupo.length) return null
                          return (
                            <div key={label}>
                              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                {grupo.map(hora => (
                                  <button key={hora} onClick={() => setSelectedHora(hora)}
                                    className={`rounded-xl border p-2.5 text-sm font-semibold transition-all ${selectedHora === hora ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary'}`}>
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

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedFecha || !selectedHora} size="lg">
                    Continuar <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {[
                    { label: 'Servicio', value: servicioSeleccionado?.nombre_servicio },
                    { label: 'Barbero', value: barberoSeleccionado?.nombre_completo },
                    { label: 'Fecha', value: selectedFecha && new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) },
                    { label: 'Hora', value: selectedHora ? `${selectedHora} hs` : '' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold capitalize">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-black text-primary">${Number(servicioSeleccionado?.precio ?? 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input id="nombre" placeholder="Ej: Juan Pérez" value={clienteData.nombre}
                      onChange={e => setClienteData(p => ({ ...p, nombre: e.target.value }))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input id="telefono" placeholder="+54 11 1234-5678" value={clienteData.telefono}
                      onChange={e => setClienteData(p => ({ ...p, telefono: e.target.value }))} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input id="email" type="email" placeholder="tu@email.com" value={clienteData.email}
                      onChange={e => setClienteData(p => ({ ...p, email: e.target.value }))} className="mt-1.5" />
                  </div>
                </div>

                {errorReserva && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />{errorReserva}
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center px-2">
                  Al confirmar aceptás que tus datos (nombre, teléfono y email) sean utilizados exclusivamente para gestionar tu turno y enviarte notificaciones relacionadas.
                </p>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)}>Atrás</Button>
                  <Button size="lg" onClick={handleConfirmarReserva}
                    disabled={!clienteData.nombre || !clienteData.telefono || enviando}>
                    {enviando ? <><Loader2 className="mr-2 size-4 animate-spin" />Reservando...</> : 'Confirmar reserva'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card/60 pt-12 pb-6">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {barberia.logo_url && <img src={barberia.logo_url} alt={nombreBarberia} className="h-8 w-auto max-w-[36px] object-contain" />}
                <h3 className="font-black text-lg">{nombreBarberia}</h3>
              </div>
              {barberia.slogan && <p className="text-sm text-muted-foreground italic">{barberia.slogan}</p>}
              <div className="flex gap-3">
                {barberia.instagram && (
                  <a href={`https://instagram.com/${barberia.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <IconInstagram className="size-4" />
                  </a>
                )}
                {barberia.facebook && (
                  <a href={`https://facebook.com/${barberia.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <IconFacebook className="size-4" />
                  </a>
                )}
                {barberia.whatsapp_negocio && (
                  <a href={`https://wa.me/${barberia.whatsapp_negocio.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <IconWhatsApp className="size-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Contacto</h4>
              {barberia.telefono && (
                <a href={`tel:${barberia.telefono}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                  <Phone className="size-4 shrink-0 text-primary" />{barberia.telefono}
                </a>
              )}
              {barberia.direccion && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" />{barberia.direccion}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Horarios</h4>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0 text-primary" />
                Lun–Vie: {barberia.horario_lv_desde ?? '09:00'} – {barberia.horario_lv_hasta ?? '19:00'}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0 text-primary" />
                Sábado: {barberia.horario_sab_desde ?? '09:00'} – {barberia.horario_sab_hasta ?? '15:00'}
              </p>
              <p className="text-sm text-muted-foreground pl-6">
                Domingo: {barberia.domingo_cerrado ? 'Cerrado' : 'Abierto'}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {nombreBarberia}
          </div>
        </div>
      </footer>

      {/* ── MODAL CALIFICACIÓN ── */}
      <Dialog open={!!ratingBarbero} onOpenChange={open => { if (!open) setRatingBarbero(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Calificar barbero</DialogTitle>
          </DialogHeader>
          {ratingEnviado ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
                <Check className="size-7 text-green-500" />
              </div>
              <p className="font-semibold">¡Gracias por tu calificación!</p>
              <p className="text-sm text-muted-foreground text-center">Tu opinión ayuda a mejorar el servicio.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Barbero info */}
              <div className="flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full border border-border bg-primary/10 shrink-0">
                  {ratingBarbero?.foto_url
                    ? <img src={ratingBarbero.foto_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-base font-bold text-primary">
                        {ratingBarbero?.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                  }
                </div>
                <div>
                  <p className="font-semibold text-sm">{ratingBarbero?.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">Seleccioná tu calificación</p>
                </div>
              </div>

              {/* Estrellas */}
              <div className="flex justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatingEstrellas(n)}
                    onMouseEnter={() => setRatingHover(n)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`size-9 transition-colors ${n <= (ratingHover || ratingEstrellas) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
              {ratingEstrellas > 0 && (
                <p className="text-center text-xs font-medium text-primary -mt-2">
                  {['', '😕 Muy malo', '😐 Regular', '🙂 Bueno', '😊 Muy bueno', '🤩 Excelente'][ratingEstrellas]}
                </p>
              )}

              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tu nombre (opcional)"
                value={ratingNombre}
                onChange={e => setRatingNombre(e.target.value)}
              />
              <Textarea
                placeholder="Comentario opcional..."
                rows={3}
                className="text-sm resize-none"
                value={ratingComentario}
                onChange={e => setRatingComentario(e.target.value)}
              />

              <Button
                className="w-full"
                disabled={ratingEstrellas === 0 || enviandoRating}
                onClick={async () => {
                  if (!ratingBarbero || ratingEstrellas === 0) return
                  setEnviandoRating(true)
                  try {
                    const r = await fetch(`${BACKEND_URL}/api/public/valorar`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        idusuario_barbero: ratingBarbero.idusuario,
                        nombre_cliente: ratingNombre || undefined,
                        estrellas: ratingEstrellas,
                        comentario: ratingComentario || undefined,
                      }),
                    })
                    if (r.ok) setRatingEnviado(true)
                  } finally { setEnviandoRating(false) }
                }}
              >
                {enviandoRating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {enviandoRating ? 'Enviando...' : 'Enviar calificación'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL CONFIRMACIÓN ── */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="size-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-black">¡Turno reservado!</h2>
            {reservaConfirmada?.nombre && (
              <p className="text-sm text-muted-foreground">Gracias, <span className="font-semibold text-foreground">{reservaConfirmada.nombre}</span></p>
            )}
          </div>

          <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden text-sm mx-1">
            {[
              { icon: Scissors, label: 'Servicio', value: reservaConfirmada?.servicio },
              { icon: Star, label: 'Barbero', value: reservaConfirmada?.barbero ?? '—' },
              { icon: Calendar, label: 'Fecha', value: reservaConfirmada?.fecha ? new Date(reservaConfirmada.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : '' },
              { icon: Clock, label: 'Hora', value: `${reservaConfirmada?.hora_inicio} hs` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5" />{label}</span>
                <span className="font-semibold capitalize">{value}</span>
              </div>
            ))}
            {reservaConfirmada?.precio != null && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Total</span>
                <span className="font-black text-primary">${Number(reservaConfirmada.precio).toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>

          {barberia.whatsapp_negocio && (
            <a href={`https://wa.me/${barberia.whatsapp_negocio.replace(/\D/g,'')}?text=Hola! Reservé un turno para el ${reservaConfirmada?.fecha}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-500/20 transition-colors mx-1">
              <MessageCircle className="size-4" /> Contactar por WhatsApp
            </a>
          )}

          {/* Dónde */}
          {barberia.direccion && (
            <div className="rounded-xl border border-border bg-card mx-1 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Dónde</p>
                  <p className="font-bold text-sm leading-tight">{nombreBarberia}</p>
                  <p className="text-xs text-muted-foreground truncate">{barberia.direccion}</p>
                </div>
                {barberia.logo_url && (
                  <img src={barberia.logo_url} alt={nombreBarberia} className="size-12 shrink-0 rounded-lg object-cover border border-border" />
                )}
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barberia.direccion)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                <MapPin className="size-4" /> Cómo llegar
              </a>
            </div>
          )}

          {/* Política de cancelación */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 mx-1 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Política de cancelación</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✉</span>
                Recibiste un email con el link para cancelar tu turno.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">⏱</span>
                Podés cancelar con hasta {barberia.tiempo_cancelacion ?? 60} {(barberia.tiempo_cancelacion ?? 60) < 60 ? 'minutos' : `${Math.round((barberia.tiempo_cancelacion ?? 60) / 60)} hora${(barberia.tiempo_cancelacion ?? 60) > 60 ? 's' : ''}`} de anticipación.
              </li>
            </ul>
          </div>

          <Button onClick={resetReserva} className="w-full" size="lg">Hacer otra reserva</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
