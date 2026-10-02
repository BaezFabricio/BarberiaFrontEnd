'use client'

import { Lock, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Se renderiza en lugar del panel, sin navegar: la URL no cambia y no existe
// una ruta suelta a la que se pueda entrar a mano.
// No debe llamar a la API: el backend está devolviendo 403.
const SOPORTE_EMAIL = 'fabriciobaezz11@gmail.com'
const SOPORTE_TEL_INTL = '5493704011885' // 549 + área + número, igual criterio que formatearNumeroAR
const SOPORTE_TEL_VISIBLE = '3704 01-1885'
const ASUNTO = 'Panel bloqueado — solicitud de reactivación'

// Se abre el compose de Gmail en el navegador en vez de un mailto:, que lanza
// el cliente de correo del sistema (Outlook y su popup de confirmación).
const GMAIL_COMPOSE =
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SOPORTE_EMAIL)}` +
  `&su=${encodeURIComponent(ASUNTO)}`

const WHATSAPP_URL =
  `https://wa.me/${SOPORTE_TEL_INTL}?text=${encodeURIComponent('Hola, el panel está bloqueado y necesito reactivarlo.')}`

export function PanelBloqueado() {
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

          <div className="flex w-full flex-col gap-3">
            <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Escribir por WhatsApp
              </a>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer">
                <Mail className="size-4" />
                Enviar un correo
              </a>
            </Button>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{SOPORTE_TEL_VISIBLE}</p>
            <p>{SOPORTE_EMAIL}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
