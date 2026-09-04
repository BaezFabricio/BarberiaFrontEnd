'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminHeader } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { ImagePlus, Trash2, Loader2, Images } from 'lucide-react'
import { api } from '@/lib/api'

type GaleriaImg = { idimagen: number; url: string }

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000'

export default function GaleriaPage() {
  const [imagenes, setImagenes] = useState<GaleriaImg[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cargar = () =>
    api.get<GaleriaImg[]>('/galeria').then(setImagenes).catch(() => {})

  useEffect(() => { cargar() }, [])

  const subirFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setSubiendo(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('imagenes', f))
      const token = localStorage.getItem('token')
      const res = await fetch(`${BACKEND_URL}/api/galeria`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error()
      cargar()
    } catch {}
    finally { setSubiendo(false); e.target.value = '' }
  }

  const eliminar = async (id: number) => {
    setEliminando(id)
    try { await api.delete(`/galeria/${id}`); cargar() }
    catch {} finally { setEliminando(null) }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Galería" subtitle="Fotos que aparecen en la sección galería de la landing" />

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* Upload */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{imagenes.length} foto{imagenes.length !== 1 ? 's' : ''} cargada{imagenes.length !== 1 ? 's' : ''}</p>
          <Button onClick={() => inputRef.current?.click()} disabled={subiendo}>
            {subiendo ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
            {subiendo ? 'Subiendo...' : 'Agregar fotos'}
          </Button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={subirFotos} />
        </div>

        {/* Grid */}
        {imagenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
              <Images className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sin fotos todavía</p>
              <p className="text-xs text-muted-foreground mt-1">Subí fotos de cortes, el local y el equipo para mostrarlas en la landing</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="mr-2 size-4" /> Subir primera foto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imagenes.map(img => (
              <div key={img.idimagen} className="group relative aspect-square overflow-hidden rounded-xl bg-muted border border-border">
                <img src={img.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                <button
                  onClick={() => eliminar(img.idimagen)}
                  disabled={eliminando === img.idimagen}
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  {eliminando === img.idimagen
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Trash2 className="size-3.5" />
                  }
                </button>
              </div>
            ))}

            {/* Botón agregar más inline */}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ImagePlus className="size-6" />
              <span className="text-xs font-medium">Agregar</span>
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Las fotos se muestran en la sección &quot;Nuestro trabajo&quot; de la landing. Recomendado: fotos cuadradas de al menos 800×800px.
        </p>
      </div>
    </div>
  )
}
