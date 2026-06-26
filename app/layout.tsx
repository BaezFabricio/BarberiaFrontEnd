import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono, Cinzel, Playfair_Display, Oswald, Bebas_Neue, Abril_Fatface } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-geist-mono' });
const cinzel = Cinzel({ subsets: ["latin"], weight: "700", variable: '--font-cinzel' });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "700", variable: '--font-playfair' });
const oswald = Oswald({ subsets: ["latin"], weight: "600", variable: '--font-oswald' });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: '--font-bebas' });
const abrilFatface = Abril_Fatface({ subsets: ["latin"], weight: "400", variable: '--font-abril' });

export const metadata: Metadata = {
  title: 'Barber Studio - Sistema de Gestion',
  description: 'Sistema profesional de gestion para barberias. Agenda turnos, gestiona clientes, barberos y reportes.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a1a1f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  try {
    var hex = localStorage.getItem('barberia_color');
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    var tl=function(c){return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
    var rl=tl(r/255),gl=tl(g/255),bl=tl(b/255);
    var x=0.4124564*rl+0.3575761*gl+0.1804375*bl,y=0.2126729*rl+0.7151522*gl+0.0721750*bl,z=0.0193339*rl+0.1191920*gl+0.9503041*bl;
    var l_=Math.cbrt(0.8189330101*x+0.3618667424*y-0.1288597137*z),m_=Math.cbrt(0.0329845436*x+0.9293118715*y+0.0361456387*z),s_=Math.cbrt(0.0482003018*x+0.2643662691*y+0.6338517070*z);
    var L=0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,a=1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,bk=0.0259040371*l_+0.7827717662*m_-0.8086757660*s_;
    var C=Math.sqrt(a*a+bk*bk),h=Math.atan2(bk,a)*(180/Math.PI);
    if(h<0)h+=360;
    var oklch='oklch('+L.toFixed(3)+' '+C.toFixed(3)+' '+h.toFixed(1)+')';
    document.documentElement.style.setProperty('--primary',oklch);
    document.documentElement.style.setProperty('--primary-rgb',r+','+g+','+b);
    var lum=(0.299*r+0.587*g+0.114*b)/255;
    document.documentElement.style.setProperty('--primary-foreground',lum>0.55?'oklch(0.13 0.005 285)':'oklch(0.98 0 0)');
  } catch(e){}
})();
        ` }} />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} ${cinzel.variable} ${playfair.variable} ${oswald.variable} ${bebasNeue.variable} ${abrilFatface.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
