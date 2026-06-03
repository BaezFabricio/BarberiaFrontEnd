"use client"

import { Scissors } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function BarberoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header simple para movil */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/barbero" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Barber Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-muted-foreground">Portal Barbero</span>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="pb-20">
        {children}
      </main>
    </div>
  )
}
