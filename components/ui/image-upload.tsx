'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Loader2, X } from 'lucide-react'

interface ImageUploadProps {
  currentUrl?: string | null
  onUpload: (file: File) => Promise<string>
  shape?: 'circle' | 'square'
  size?: number
  placeholder?: string
}

export function ImageUpload({ currentUrl, onUpload, shape = 'square', size = 80, placeholder }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Solo se permiten imágenes.')
    if (file.size > 5 * 1024 * 1024) return setError('Máximo 5MB.')
    setError('')
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const url = await onUpload(file)
      setPreview(url)
    } catch {
      setError('Error al subir la imagen.')
      setPreview(currentUrl ?? null)
    } finally {
      setLoading(false)
    }
  }

  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative overflow-hidden border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary ${radius}`}
        style={{ width: size, height: size }}
      >
        {preview ? (
          <Image src={preview} alt="preview" fill className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <Camera className="size-5" />
            {placeholder && <span className="px-1 text-center text-[10px]">{placeholder}</span>}
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 rounded-full bg-primary p-1 shadow">
          <Camera className="size-2.5 text-primary-foreground" />
        </div>
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
