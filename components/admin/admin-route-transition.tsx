'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function AdminRouteTransition() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (previousPathname.current === pathname) return

    previousPathname.current = pathname
    setIsVisible(true)

    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [pathname])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-amber-400/20 bg-card/70 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        <div className="size-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    </div>
  )
}
