const STORAGE_KEY = 'barberia_color'

function hexToOklch(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return ''
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b)

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const bk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  const C = Math.sqrt(a * a + bk * bk)
  let h = Math.atan2(bk, a) * (180 / Math.PI)
  if (h < 0) h += 360

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`
}

function setForeground(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const fg = lum > 0.55 ? 'oklch(0.13 0.005 285)' : 'oklch(0.98 0 0)'
  document.documentElement.style.setProperty('--primary-foreground', fg)
}

export function aplicarColor(hex: string, save = false) {
  if (!hex || typeof document === 'undefined') return
  const oklch = hexToOklch(hex)
  if (!oklch) return
  document.documentElement.style.setProperty('--primary', oklch)
  setForeground(hex)
  // Guardar R,G,B separados para poder usarlos en rgba() en inline styles
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  document.documentElement.style.setProperty('--primary-rgb', `${r},${g},${b}`)
  if (save) localStorage.setItem(STORAGE_KEY, hex)
}

// Llamar al inicio de cada layout — aplica el color guardado antes del primer render
export function aplicarColorGuardado() {
  if (typeof window === 'undefined') return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) aplicarColor(saved)
}
