import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init.js';


dotenv.config();


const app: Express = express();
const PORT = process.env.PORT || 3001;


// MIDDLEWARE - CORS CONFIGURADO PARA PRODUCCIÓN
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://vitadoc.vercel.app'
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());


// HEALTH CHECK
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'VitaDoc API running ✅', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    version: '3.0.0'
  });
});


// CARGAR RUTAS DE FORMA SEGURA (ASYNC)
async function initializeRoutes() {
  try {
    // ✅ INICIALIZAR BASE DE DATOS PRIMERO
    await initializeDatabase();

    // Cargar todos los módulos de rutas (CON .js)
    const authRoutes = (await import('./routes/auth.routes.js')).default;
    const patientRoutes = (await import('./routes/patients.routes.js')).default;
    const medicalVisitsRoutes = (await import('./routes/medical-visits.routes.js')).default;
    const tenantsRoutes = (await import('./routes/tenants.routes.js')).default;
    const clientsRoutes = (await import('./routes/clients.routes.js')).default;
    const invitationsRoutes = (await import('./routes/invitations.routes.js')).default;
    const auditRoutes = (await import('./routes/audit.routes.js')).default;


    // REGISTRAR RUTAS
    app.use('/api/auth', authRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/medical-visits', medicalVisitsRoutes);
    app.use('/api/tenants', tenantsRoutes);
    app.use('/api/clients', clientsRoutes);
    app.use('/api/invitations', invitationsRoutes);
    app.use('/api/audit', auditRoutes);


    console.log('✅ Todas las rutas cargadas exitosamente');
  } catch (error) {
    console.error('❌ Error al cargar rutas:', error);
    process.exit(1);
  }
}


// ERROR 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});


// INICIAR SERVIDOR CON RUTAS CARGADAS
async function startServer() {
  await initializeRoutes();


  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🏥 VITADOC SERVER INICIADO 🏥      ║
╚════════════════════════════════════════╝
  
  Puerto: ${PORT}
  Entorno: ${process.env.NODE_ENV}
  URL: http://localhost:${PORT}
  API: http://localhost:${PORT}/api
  
  ✅ Rutas disponibles:
    - /api/auth (Autenticación)
    - /api/patients (Pacientes)
    - /api/medical-visits (Consultas médicas)
    - /api/tenants (Gestión de clínicas - B2B)
    - /api/clients (Gestión de clientes - B2B)
    - /api/invitations (Invitaciones de usuarios - B2B)
    - /api/audit (Auditoría)
  
  ✅ Métodos HTTP soportados: GET, POST, PUT, DELETE, PATCH, OPTIONS
  
  Presiona Ctrl+C para detener
  `);
  });


  server.on('error', (error: Error) => {
    console.error('❌ Error en servidor:', error);
    process.exit(1);
  });


  process.on('unhandledRejection', (reason: Error) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });
}


// Ejecutar servidor
startServer().catch((error) => {
  console.error('❌ Error al iniciar servidor:', error);
  process.exit(1);
});


export default app;
