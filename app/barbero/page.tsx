"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { barberos } from "@/lib/mock-data"
import { Scissors, AlertCircle, User, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

// Simula PINs guardados (en produccion estaria en la base de datos)
// null = el barbero aun no ha creado su PIN
const barberosPIN: Record<string, string | null> = {
  "1": "1234",
  "2": null, 
  "3": null
}

export default function LoginBarbero() {
  const router = useRouter()
  const [step, setStep] = useState<"select" | "login" | "create">("select")
  const [selectedBarbero, setSelectedBarbero] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const barberosActivos = barberos.filter(b => b.activo)

  const handleSelectBarbero = (id: string) => {
    setSelectedBarbero(id)
    setError("")
    setPin("")
    setConfirmPin("")
    
    // Si el barbero ya tiene PIN, ir a login. Si no, ir a crear PIN
    if (barberosPIN[id]) {
      setStep("login")
    } else {
      setStep("create")
    }
  }

  const handleLogin = () => {
    if (!selectedBarbero) return
    setError("")
    setLoading(true)

    if (barberosPIN[selectedBarbero] === pin) {
      router.push(`/barbero/${selectedBarbero}`)
      return
    }

    setLoading(false)
    setError("PIN incorrecto. Intenta de nuevo.")
    setPin("")
  }

  const handleCreatePin = () => {
    if (!selectedBarbero) return
    setError("")

    if (pin.length !== 4) {
      setError("El PIN debe tener 4 digitos")
      return
    }

    if (pin !== confirmPin) {
      setError("Los PINs no coinciden")
      return
    }

    setLoading(true)
    // En produccion esto guardaria el PIN en la base de datos
    barberosPIN[selectedBarbero] = pin
    router.push(`/barbero/${selectedBarbero}`)
  }

  const handleBack = () => {
    setStep("select")
    setSelectedBarbero(null)
    setPin("")
    setConfirmPin("")
    setError("")
  }

  const selectedBarberoData = barberos.find(b => b.id === selectedBarbero)

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Portal del Barbero</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "select" && "Selecciona tu nombre para continuar"}
              {step === "login" && `Hola ${selectedBarberoData?.nombre}, ingresa tu PIN`}
              {step === "create" && `Hola ${selectedBarberoData?.nombre}, crea tu PIN de acceso`}
            </p>
          </div>

          {step === "select" && (
            <div className="space-y-2">
              {barberosActivos.map((barbero) => (
                <button
                  key={barbero.id}
                  onClick={() => handleSelectBarbero(barbero.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{barbero.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {barberosPIN[barbero.id] ? "PIN configurado" : "Primer acceso"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {step === "login" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN de acceso</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="****"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setPin(value)
                    setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && pin.length === 4 && handleLogin()}
                  className="text-center text-2xl tracking-[0.5em]"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={pin.length !== 4 || loading}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>

              <Button variant="ghost" onClick={handleBack} className="w-full">
                Volver
              </Button>
            </div>
          )}

          {step === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newpin">Crea tu PIN (4 digitos)</Label>
                <Input
                  id="newpin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="****"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setPin(value)
                    setError("")
                  }}
                  className="text-center text-2xl tracking-[0.5em]"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmpin">Confirma tu PIN</Label>
                <Input
                  id="confirmpin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="****"
                  value={confirmPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    setConfirmPin(value)
                    setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && pin.length === 4 && confirmPin.length === 4 && handleCreatePin()}
                  className="text-center text-2xl tracking-[0.5em]"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleCreatePin} 
                className="w-full"
                disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
              >
                {loading ? "Creando..." : "Crear PIN y entrar"}
              </Button>

              <Button variant="ghost" onClick={handleBack} className="w-full">
                Volver
              </Button>
            </div>
          )}

          
        </CardContent>
      </Card>
    </div>
  )
}
