import { 
  Barber, 
  Client, 
  Service, 
  Appointment, 
  Product, 
  Sale, 
  Expense, 
  Notification,
  BusinessStats 
} from './types';

// Barberos
export const barberos: Barber[] = [
  {
    id: 'b1',
    nombre: 'Alex Barber',
    email: 'Alex@barberstudio.com',
    telefono: '+54 11 4567-8901',
    rol: 'barbero',
    activo: true,
    fechaRegistro: '2023-01-15',
    avatar: '/avatars/Alex.jpg',
    especialidades: ['Corte clasico', 'Barba', 'Fade'],
    comision: 40,
    horarioTrabajo: {
      lunes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      martes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      miercoles: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      jueves: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      viernes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      sabado: { inicio: '09:00', fin: '14:00' },
      domingo: null
    },
    estadisticas: {
      clientesAtendidos: 245,
      ingresosMes: 185000,
      calificacionPromedio: 4.8,
      turnosMes: 68
    }
  },
  {
    id: 'b2',
    nombre: 'Bando Barber',
    email: 'miguel@barberstudio.com',
    telefono: '+54 11 4567-8902',
    rol: 'barbero',
    activo: true,
    fechaRegistro: '2023-03-20',
    avatar: '/avatars/miguel.jpg',
    especialidades: ['Fade', 'Disenos', 'Color'],
    comision: 35,
    horarioTrabajo: {
      lunes: { inicio: '10:00', fin: '19:00', descanso: { inicio: '14:00', fin: '15:00' } },
      martes: { inicio: '10:00', fin: '19:00', descanso: { inicio: '14:00', fin: '15:00' } },
      miercoles: { inicio: '10:00', fin: '19:00', descanso: { inicio: '14:00', fin: '15:00' } },
      jueves: { inicio: '10:00', fin: '19:00', descanso: { inicio: '14:00', fin: '15:00' } },
      viernes: { inicio: '10:00', fin: '19:00', descanso: { inicio: '14:00', fin: '15:00' } },
      sabado: { inicio: '09:00', fin: '15:00' },
      domingo: null
    },
    estadisticas: {
      clientesAtendidos: 198,
      ingresosMes: 152000,
      calificacionPromedio: 4.6,
      turnosMes: 55
    }
  },
  {
    id: 'b3',
    nombre: 'Faray Cutss',
    email: 'lucas@barberstudio.com',
    telefono: '+54 11 4567-8903',
    rol: 'barbero',
    activo: true,
    fechaRegistro: '2023-06-10',
    avatar: '/avatars/lucas.jpg',
    especialidades: ['Corte moderno', 'Barba', 'Tratamientos capilares'],
    comision: 35,
    horarioTrabajo: {
      lunes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      martes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      miercoles: null,
      jueves: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      viernes: { inicio: '09:00', fin: '18:00', descanso: { inicio: '13:00', fin: '14:00' } },
      sabado: { inicio: '09:00', fin: '14:00' },
      domingo: null
    },
    estadisticas: {
      clientesAtendidos: 156,
      ingresosMes: 125000,
      calificacionPromedio: 4.7,
      turnosMes: 42
    }
  },
 
];

// Servicios
export const servicios: Service[] = [
  {
    id: 's1',
    nombre: 'Corte de Cabello',
    descripcion: 'Corte clasico o moderno segun preferencia del cliente',
    precio: 3500,
    duracion: 40,
    activo: true
  },
  {
    id: 's2',
    nombre: 'Corte + Barba',
    descripcion: 'Corte de cabello completo mas arreglo de barba con toalla caliente',
    precio: 5500,
    duracion: 60,
    activo: true
  },
  {
    id: 's3',
    nombre: 'Arreglo de Barba',
    descripcion: 'Perfilado y arreglo de barba con toalla caliente y aceites',
    precio: 2500,
    duracion: 30,
    activo: true
  },
  {
    id: 's4',
    nombre: 'Fade Premium',
    descripcion: 'Corte degradado profesional con detalles personalizados',
    precio: 4500,
    duracion: 50,
    activo: true
  },
  {
    id: 's5',
    nombre: 'Diseno Personalizado',
    descripcion: 'Disenos y figuras en el cabello segun solicitud',
    precio: 2000,
    duracion: 20,
    activo: true
  },
  {
    id: 's6',
    nombre: 'Tratamiento Capilar',
    descripcion: 'Tratamiento hidratante y revitalizador para el cabello',
    precio: 3000,
    duracion: 30,
    activo: true
  },
  {
    id: 's7',
    nombre: 'Color / Tintura',
    descripcion: 'Aplicacion de color o tintura segun preferencia',
    precio: 5000,
    duracion: 60,
    activo: true
  },
  {
    id: 's8',
    nombre: 'Afeitado Clasico',
    descripcion: 'Afeitado tradicional con navaja y toalla caliente',
    precio: 2000,
    duracion: 25,
    activo: false
  }
];

// Clientes
export const clientes: Client[] = [
  {
    id: 'c1',
    nombre: 'Fabricio Baez',
    email: 'juan.perez@email.com',
    telefono: '+54 11 5555-1234',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-02-10',
    historialTurnos: ['t1', 't5', 't12'],
    turnosTotales: 15,
    ultimaVisita: '2024-01-15',
    esClienteFrecuente: true,
    notas: 'Prefiere corte bajo a los costados',
    ausencias: 0
  },
  {
    id: 'c2',
    nombre: 'Cuenca Gustavo',
    email: 'pedro.garcia@email.com',
    telefono: '+54 11 5555-2345',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-04-22',
    historialTurnos: ['t2', 't8'],
    turnosTotales: 8,
    ultimaVisita: '2024-01-10',
    esClienteFrecuente: true,
    ausencias: 1
  },
  {
    id: 'c3',
    nombre: 'Enzo Araujo',
    email: 'martin.lopez@email.com',
    telefono: '+54 11 5555-3456',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-07-15',
    historialTurnos: ['t3'],
    turnosTotales: 5,
    ultimaVisita: '2023-12-20',
    esClienteFrecuente: false,
    ausencias: 0
  },
  {
    id: 'c4',
    nombre: 'Mauro Mitchell',
    email: 'roberto.sanchez@email.com',
    telefono: '+54 11 5555-4567',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-09-01',
    historialTurnos: ['t4'],
    turnosTotales: 3,
    ultimaVisita: '2023-11-05',
    esClienteFrecuente: false,
    notas: 'Cliente inactivo - hace mas de 60 dias sin visitar',
    ausencias: 2
  },
  {
    id: 'c5',
    nombre: 'Luis Baez',
    email: 'diego.romero@email.com',
    telefono: '+54 11 5555-5678',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2024-01-02',
    historialTurnos: [],
    turnosTotales: 1,
    ultimaVisita: '2024-01-18',
    esClienteFrecuente: false,
    ausencias: 0
  },
  {
    id: 'c6',
    nombre: 'Javier Ruiz',
    email: 'facundo.torres@email.com',
    telefono: '+54 11 5555-6789',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-05-18',
    historialTurnos: ['t6', 't9', 't11'],
    turnosTotales: 12,
    ultimaVisita: '2024-01-12',
    esClienteFrecuente: true,
    notas: 'Siempre pide con Carlos',
    ausencias: 0
  },
  {
    id: 'c7',
    nombre: 'Cerquand Fernando',
    email: 'nicolas.mendez@email.com',
    telefono: '+54 11 5555-7890',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-08-25',
    historialTurnos: ['t7'],
    turnosTotales: 4,
    ultimaVisita: '2024-01-08',
    esClienteFrecuente: false,
    ausencias: 1
  },
  {
    id: 'c8',
    nombre: 'Mercado Oscar',
    email: 'gonzalo.ruiz@email.com',
    telefono: '+54 11 5555-8901',
    rol: 'cliente',
    activo: true,
    fechaRegistro: '2023-11-10',
    historialTurnos: ['t10'],
    turnosTotales: 2,
    ultimaVisita: '2024-01-05',
    esClienteFrecuente: false,
    ausencias: 0
  }
];

// Productos
export const productos: Product[] = [
  {
    id: 'p1',
    nombre: 'Pomada Fijacion Fuerte',
    descripcion: 'Pomada para cabello con fijacion extra fuerte y brillo mate',
    precio: 2800,
    stock: 15,
    stockMinimo: 5,
    categoria: 'Styling',
    activo: true
  },
  {
    id: 'p2',
    nombre: 'Aceite para Barba',
    descripcion: 'Aceite hidratante y suavizante para barba 50ml',
    precio: 3200,
    stock: 8,
    stockMinimo: 3,
    categoria: 'Barba',
    activo: true
  },
  {
    id: 'p3',
    nombre: 'Cera Modeladora',
    descripcion: 'Cera para modelar con fijacion media y acabado natural',
    precio: 2500,
    stock: 2,
    stockMinimo: 5,
    categoria: 'Styling',
    activo: true
  },
  {
    id: 'p4',
    nombre: 'Shampoo Anticaspa',
    descripcion: 'Shampoo especializado para control de caspa 250ml',
    precio: 1800,
    stock: 12,
    stockMinimo: 4,
    categoria: 'Cuidado',
    activo: true
  },
  {
    id: 'p5',
    nombre: 'Balsamo para Barba',
    descripcion: 'Balsamo acondicionador para barba con manteca de karite',
    precio: 2900,
    stock: 6,
    stockMinimo: 3,
    categoria: 'Barba',
    activo: true
  },
  {
    id: 'p6',
    nombre: 'Gel Fijador',
    descripcion: 'Gel de fijacion fuerte sin residuos 300ml',
    precio: 1500,
    stock: 20,
    stockMinimo: 8,
    categoria: 'Styling',
    activo: true
  },
  {
    id: 'p7',
    nombre: 'Locion Aftershave',
    descripcion: 'Locion calmante post afeitado con aloe vera',
    precio: 2200,
    stock: 1,
    stockMinimo: 3,
    categoria: 'Afeitado',
    activo: true
  },
  {
    id: 'p8',
    nombre: 'Cepillo para Barba',
    descripcion: 'Cepillo de cerdas naturales para barba',
    precio: 1800,
    stock: 4,
    stockMinimo: 2,
    categoria: 'Accesorios',
    activo: true
  }
];

// Funcion para obtener la fecha actual y generar turnos realistas
const hoy = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Turnos
export const turnos: Appointment[] = [
  {
    id: 't1',
    clienteId: 'c1',
    cliente: clientes[0],
    barberoId: 'b1',
    barbero: barberos[0],
    servicioId: 's2',
    servicio: servicios[1],
    fecha: formatDate(hoy),
    horaInicio: '09:00',
    horaFin: '10:00',
    estado: 'confirmado',
    tipo: 'reserva_previa',
    precioFinal: 5500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't2',
    clienteId: 'c2',
    cliente: clientes[1],
    barberoId: 'b2',
    barbero: barberos[1],
    servicioId: 's1',
    servicio: servicios[0],
    fecha: formatDate(hoy),
    horaInicio: '10:00',
    horaFin: '10:40',
    estado: 'reservado',
    tipo: 'reserva_previa',
    precioFinal: 3500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't3',
    clienteId: 'c3',
    cliente: clientes[2],
    barberoId: 'b1',
    barbero: barberos[0],
    servicioId: 's4',
    servicio: servicios[3],
    fecha: formatDate(hoy),
    horaInicio: '10:00',
    horaFin: '10:50',
    estado: 'confirmado',
    tipo: 'orden_llegada',
    precioFinal: 4500,
    fechaCreacion: formatDate(hoy)
  },
  {
    id: 't4',
    clienteId: 'c6',
    cliente: clientes[5],
    barberoId: 'b1',
    barbero: barberos[0],
    servicioId: 's1',
    servicio: servicios[0],
    fecha: formatDate(hoy),
    horaInicio: '11:00',
    horaFin: '11:40',
    estado: 'reservado',
    tipo: 'reserva_previa',
    precioFinal: 3500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't5',
    clienteId: 'c5',
    cliente: clientes[4],
    barberoId: 'b3',
    barbero: barberos[2],
    servicioId: 's3',
    servicio: servicios[2],
    fecha: formatDate(hoy),
    horaInicio: '09:30',
    horaFin: '10:00',
    estado: 'finalizado',
    tipo: 'reserva_previa',
    precioFinal: 2500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't6',
    clienteId: 'c7',
    cliente: clientes[6],
    barberoId: 'b2',
    barbero: barberos[1],
    servicioId: 's2',
    servicio: servicios[1],
    fecha: formatDate(hoy),
    horaInicio: '11:00',
    horaFin: '12:00',
    estado: 'reservado',
    tipo: 'reserva_previa',
    precioFinal: 5500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't7',
    clienteId: 'c8',
    cliente: clientes[7],
    barberoId: 'b3',
    barbero: barberos[2],
    servicioId: 's1',
    servicio: servicios[0],
    fecha: formatDate(hoy),
    horaInicio: '14:00',
    horaFin: '14:40',
    estado: 'reservado',
    tipo: 'reserva_previa',
    precioFinal: 3500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 4 * 24 * 60 * 60 * 1000))
  },
  {
    id: 't8',
    clienteId: 'c1',
    cliente: clientes[0],
    barberoId: 'b2',
    barbero: barberos[1],
    servicioId: 's4',
    servicio: servicios[3],
    fecha: formatDate(new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000)),
    horaInicio: '10:00',
    horaFin: '10:50',
    estado: 'reservado',
    tipo: 'reserva_previa',
    precioFinal: 4500,
    fechaCreacion: formatDate(hoy)
  },
  {
    id: 't9',
    clienteId: 'c4',
    cliente: clientes[3],
    barberoId: 'b1',
    barbero: barberos[0],
    servicioId: 's1',
    servicio: servicios[0],
    fecha: formatDate(new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)),
    horaInicio: '15:00',
    horaFin: '15:40',
    estado: 'ausente',
    tipo: 'reserva_previa',
    precioFinal: 3500,
    fechaCreacion: formatDate(new Date(hoy.getTime() - 32 * 24 * 60 * 60 * 1000))
  }
];

// Ventas
export const ventas: Sale[] = [
  {
    id: 'v1',
    productos: [
      {
        productoId: 'p1',
        producto: productos[0],
        cantidad: 1,
        precioUnitario: 2800,
        subtotal: 2800
      }
    ],
    clienteId: 'c1',
    total: 2800,
    metodoPago: 'efectivo',
    fecha: formatDate(hoy),
    vendedorId: 'b1'
  },
  {
    id: 'v2',
    productos: [
      {
        productoId: 'p2',
        producto: productos[1],
        cantidad: 2,
        precioUnitario: 3200,
        subtotal: 6400
      },
      {
        productoId: 'p5',
        producto: productos[4],
        cantidad: 1,
        precioUnitario: 2900,
        subtotal: 2900
      }
    ],
    clienteId: 'c6',
    total: 9300,
    metodoPago: 'transferencia',
    fecha: formatDate(new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000)),
    vendedorId: 'b2'
  },
  {
    id: 'v3',
    productos: [
      {
        productoId: 'p4',
        producto: productos[3],
        cantidad: 1,
        precioUnitario: 1800,
        subtotal: 1800
      }
    ],
    clienteId: 'c2',
    total: 1800,
    metodoPago: 'efectivo',
    fecha: formatDate(new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000)),
    vendedorId: 'b1'
  }
];

// Gastos
export const gastos: Expense[] = [
  {
    id: 'g1',
    fecha: formatDate(new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000)),
    descripcion: 'Alquiler del local - Enero 2024',
    monto: 150000,
    categoria: 'alquiler'
  },
  {
    id: 'g2',
    fecha: formatDate(new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000)),
    descripcion: 'Factura de luz',
    monto: 25000,
    categoria: 'servicios'
  },
  {
    id: 'g3',
    fecha: formatDate(new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000)),
    descripcion: 'Compra de insumos - Cremas y lociones',
    monto: 35000,
    categoria: 'insumos'
  },
  {
    id: 'g4',
    fecha: formatDate(new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000)),
    descripcion: 'Reparacion de sillon',
    monto: 15000,
    categoria: 'mantenimiento'
  },
  {
    id: 'g5',
    fecha: formatDate(hoy),
    descripcion: 'Monotributo - Enero 2024',
    monto: 18000,
    categoria: 'impuestos'
  },
  {
    id: 'g6',
    fecha: formatDate(new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)),
    descripcion: 'Sueldo Alex Barber',
    monto: 280000,
    categoria: 'sueldos'
  },
  {
    id: 'g7',
    fecha: formatDate(new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)),
    descripcion: 'Sueldo Bando Barber',
    monto: 250000,
    categoria: 'sueldos'
  }
];

// Notificaciones
export const notificaciones: Notification[] = [
  {
    id: 'n1',
    tipo: 'reserva',
    titulo: 'Nueva reserva',
    mensaje: 'Fabricio Baez reservo un turno para hoy a las 09:00',
    destinatarioId: 'b1',
    leida: false,
    fecha: formatDate(new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'n2',
    tipo: 'sistema',
    titulo: 'Stock bajo',
    mensaje: 'El producto "Cera Modeladora" tiene stock bajo (2 unidades)',
    destinatarioId: 'admin',
    leida: false,
    fecha: formatDate(hoy)
  },
  {
    id: 'n3',
    tipo: 'sistema',
    titulo: 'Stock critico',
    mensaje: 'El producto "Locion Aftershave" tiene solo 1 unidad disponible',
    destinatarioId: 'admin',
    leida: false,
    fecha: formatDate(hoy)
  },
  {
    id: 'n4',
    tipo: 'recordatorio',
    titulo: 'Recordatorio de turno',
    mensaje: 'Recuerda tu turno manana a las 10:00 con Miguel',
    destinatarioId: 'c1',
    leida: true,
    fecha: formatDate(hoy)
  },
  {
    id: 'n5',
    tipo: 'promocion',
    titulo: 'Oferta especial',
    mensaje: 'Por ser cliente frecuente, tu proximo corte tiene 10% de descuento',
    destinatarioId: 'c1',
    leida: false,
    fecha: formatDate(new Date(hoy.getTime() - 1 * 24 * 60 * 60 * 1000))
  }
];

// Estadisticas del negocio
export const estadisticasNegocio: BusinessStats = {
  ingresosDiarios: 28500,
  ingresosSemanales: 185000,
  ingresosMensuales: 762000,
  turnosHoy: 7,
  turnosSemana: 45,
  clientesNuevosMes: 12,
  clientesActivos: 48,
  productosStockBajo: 3
};

// Horarios disponibles para reservas
export const horariosDisponibles = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

// Categorias de gastos para el select
export const categoriasGastos = [
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otros', label: 'Otros' }
];

// Informacion de la barberia
export const infoBarberia = {
  nombre: 'Barber Studio',
  direccion: 'Corrientes y Eva Perón, Formosa',
  telefono: '+54 11 4567-8900',
  email: 'info@barberstudio.com',
  horarios: {
    lunesViernes: '09:00 - 19:00',
    sabado: '09:00 - 15:00',
    domingo: 'Cerrado'
  },
  redesSociales: {
    instagram: '@barberrstudio_',
    facebook: 'BarberStudio',
    whatsapp: '+54 11 4567-8900'
  }
};
