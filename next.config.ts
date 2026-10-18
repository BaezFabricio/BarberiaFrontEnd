import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las páginas. Sin CSP estricta todavía: el script de color del
// layout es inline y habría que firmarlo (nonce o hash) para no romperlo.
const cabecerasDeSeguridad = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' }, // el panel no se puede incrustar en otro sitio (clickjacking)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: cabecerasDeSeguridad }];
  },
};

export default nextConfig;
