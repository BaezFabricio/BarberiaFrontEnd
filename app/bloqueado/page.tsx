'use client'

import { Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Esta pantalla no debe llamar a la API: el backend está devolviendo 403 y
// cualquier fetch volvería a redirigir acá, en loop.
const SOPORTE_EMAIL = 'fabriciobaezz11@gmail.com'
const ASUNTO = 'Panel bloqueado — solicitud de reactivación'

export default function Bloqueado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
            <Lock className="size-7 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Panel bloqueado</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El acceso al panel está suspendido temporalmente. Contactá a soporte para reactivarlo.
            </p>
          </div>

          <Button asChild className="w-full">
            <a href={`mailto:${SOPORTE_EMAIL}?subject=${encodeURIComponent(ASUNTO)}`}>
              <Mail className="size-4" />
              Contactar a soporte
            </a>
          </Button>

          <p className="text-xs text-muted-foreground">{SOPORTE_EMAIL}</p>
        </CardContent>
      </Card>
    </div>
  )
}
