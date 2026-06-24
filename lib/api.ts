const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://barberiabackend.onrender.com';
const API_BASE = `${BACKEND_URL}/api`;

// En producción extrae el subdominio de la URL del navegador.
// En localhost devuelve null y el backend lo resuelve por el JWT.
const getSubdominio = (): string | null => {
    if (typeof window === 'undefined') return null;
    const partes = window.location.hostname.split('.');
    if (partes.length >= 3 && partes[0] !== 'www') return partes[0];
    return null;
};

const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

type RequestOptions = {
    method?: string;
    body?: unknown;
    auth?: boolean;
};

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, auth = false } = options;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const subdominio = getSubdominio();
    if (subdominio) headers['X-Tenant-Subdomain'] = subdominio;

    const base = auth ? API_BASE : BACKEND_URL;
    const res = await fetch(`${base}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
    return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type RegistroPayload = {
    nombre_negocio: string;
    subdominio: string;
    nombre_completo: string;
    telefono: string;
    correo_electronico: string;
    password: string;
};

export type LoginPayload = {
    correo_electronico: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    rol: 'admin' | 'barbero';
    idbarberia: number;
};

export const authApi = {
    registro: (payload: RegistroPayload) =>
        apiRequest<{ mensaje: string; subdominio: string }>('/api/public/registro', {
            method: 'POST',
            body: payload,
            auth: false,
        }),

    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        const data = await apiRequest<LoginResponse>('/api/public/login', {
            method: 'POST',
            body: payload,
        });
        localStorage.setItem('token', data.token);
        return data;
    },

    logout: () => localStorage.removeItem('token'),
};

// ── Cliente genérico para rutas protegidas ────────────────────────────────────

export const api = {
    get: <T>(endpoint: string) => apiRequest<T>(endpoint, { auth: true }),
    post: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'POST', body, auth: true }),
    put: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PUT', body, auth: true }),
    patch: <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body, auth: true }),
    delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE', auth: true }),
};
