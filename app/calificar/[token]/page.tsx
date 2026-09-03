'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const API = process.env.NEXT_PUBLIC_BACKEND_URL

type Info = { barbero_nombre: string; barbero_foto: string | null; barberia_nombre: string }

export default function CalificarPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo]     = useState<Info | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [estrellas, setEstrellas] = useState(0)
  const [hover, setHover]   = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/public/calificar/${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setInfo(d) })
      .catch(() => setError('No se pudo cargar la información.'))
      .finally(() => setLoading(false))
  }, [token])

  const enviar = async () => {
    if (estrellas === 0) return
    setEnviando(true)
    try {
      const r = await fetch(`${API}/api/public/calificar/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estrellas, comentario: comentario || undefined }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error)
      else setEnviado(true)
    } catch { setError('Error al enviar. Intentá de nuevo.') }
    finally { setEnviando(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )

  const initials = info?.barbero_nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-8 text-center">

        {enviado ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 size-14 text-green-500" />
            <h1 className="text-xl font-bold">¡Gracias por tu calificación!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tu opinión ayuda a mejorar el servicio.</p>
          </>
        ) : error ? (
          <>
            <XCircle className="mx-auto mb-4 size-14 text-destructive" />
            <h1 className="text-xl font-bold">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            {/* Foto barbero */}
            <div className="mx-auto mb-4 size-20 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10">
              {info?.barbero_foto
                ? <img src={info.barbero_foto} alt={info.barbero_nombre} className="h-full w-full object-cover" />
                : <div className="flex h-full items-center justify-center text-2xl font-bold text-primary">{initials}</div>
              }
            </div>

            <p className="text-xs text-muted-foreground uppercase tracking-wider">{info?.barberia_nombre}</p>
            <h1 className="mt-1 text-lg font-bold">{info?.barbero_nombre}</h1>
            <p className="mt-3 text-sm text-muted-foreground">¿Cómo calificarías tu experiencia?</p>

            {/* Estrellas */}
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setEstrellas(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-9 transition-colors ${n <= (hover || estrellas) ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            {estrellas > 0 && (
              <p className="mt-2 text-xs font-medium text-primary">
                {['', '😕 Muy malo', '😐 Regular', '🙂 Bueno', '😊 Muy bueno', '🤩 Excelente'][estrellas]}
              </p>
            )}

            <Textarea
              className="mt-5 text-sm resize-none"
              placeholder="Comentario opcional..."
              rows={3}
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />

            <Button
              className="mt-4 w-full"
              disabled={estrellas === 0 || enviando}
              onClick={enviar}
            >
              {enviando ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {enviando ? 'Enviando...' : 'Enviar calificación'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
