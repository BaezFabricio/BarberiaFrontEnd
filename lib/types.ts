// Tipos para el sistema de gestion de barberia

export type UserRole = 'administrador' | 'barbero' | 'cliente';

export type AppointmentStatus =
  | 'pendiente'
  | 'confirmado'
  | 'atendido'
  | 'cobrado'
  | 'cancelado'
  | 'ausente';

export type AppointmentType = 'reserva_previa' | 'orden_llegada';

export type PaymentMethod = 'efectivo' | 'transferencia';

export type ExpenseCategory = 
  | 'impuestos' 
  | 'servicios' 
  | 'alquiler' 
  | 'sueldos' 
  | 'insumos' 
  | 'mantenimiento' 
  | 'otros';

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  activo: boolean;
  fechaRegistro: string;
  avatar?: string;
}

export interface Barber extends User {
  rol: 'barbero';
  especialidades: string[];
  comision: number;
  horarioTrabajo: WorkSchedule;
  estadisticas: BarberStats;
}

export interface WorkSchedule {
  lunes: DaySchedule | null;
  martes: DaySchedule | null;
  miercoles: DaySchedule | null;
  jueves: DaySchedule | null;
  viernes: DaySchedule | null;
  sabado: DaySchedule | null;
  domingo: DaySchedule | null;
}

export interface DaySchedule {
  inicio: string;
  fin: string;
  descanso?: {
    inicio: string;
    fin: string;
  };
}

export interface BarberStats {
  clientesAtendidos: number;
  ingresosMes: number;
  calificacionPromedio: number;
  turnosMes: number;
}

export interface Client extends User {
  rol: 'cliente';
  historialTurnos: string[];
  turnosTotales: number;
  ultimaVisita: string | null;
  esClienteFrecuente: boolean;
  notas?: string;
  ausencias: number;
}

export interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number; // en minutos
  activo: boolean;
}

export interface Appointment {
  id: string;
  clienteId: string;
  cliente: Client;
  barberoId: string;
  barbero: Barber;
  servicioId: string;
  servicio: Service;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: AppointmentStatus;
  tipo: AppointmentType;
  notas?: string;
  precioFinal: number;
  fechaCreacion: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria: string;
  activo: boolean;
}

export interface Sale {
  id: string;
  productos: SaleItem[];
  servicioId?: string;
  turnoId?: string;
  clienteId?: string;
  total: number;
  metodoPago: PaymentMethod;
  fecha: string;
  vendedorId: string;
}

export interface SaleItem {
  productoId: string;
  producto: Product;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  turnoId?: string;
  ventaId?: string;
  monto: number;
  metodoPago: PaymentMethod;
  fecha: string;
  concepto: string;
}

export interface Expense {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: ExpenseCategory;
}

export interface Notification {
  id: string;
  tipo: 'reserva' | 'recordatorio' | 'promocion' | 'sistema';
  titulo: string;
  mensaje: string;
  destinatarioId: string;
  leida: boolean;
  fecha: string;
}

export interface BusinessStats {
  ingresosDiarios: number;
  ingresosSemanales: number;
  ingresosMensuales: number;
  turnosHoy: number;
  turnosSemana: number;
  clientesNuevosMes: number;
  clientesActivos: number;
  productosStockBajo: number;
}

export interface TimeSlot {
  hora: string;
  disponible: boolean;
  turnoId?: string;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
}
