import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/init.js';

// IMPORTAR RUTAS DIRECTAMENTE (ESTÁTICO, SIN AWAIT)
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patients.routes.js';
import medicalVisitsRoutes from './routes/medical-visits.routes.js';
import tenantsRoutes from './routes/tenants.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import invitationsRoutes from './routes/invitations.routes.js';
import auditRoutes from './routes/audit.routes.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// MIDDLEWARE - CORS CONFIGURADO PARA PRODUCCIÓN
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://vitadoc-orpin.vercel.app'
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// HEALTH CHECK - ENDPOINT PUBLICO
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'VitaDoc API running ✅', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    version: '3.0.0'
  });
});

// REGISTRAR RUTAS DIRECTAMENTE (SIN AWAIT)
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-visits', medicalVisitsRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/audit', auditRoutes);

// ERROR 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// INICIAR SERVIDOR
async function startServer() {
  try {
    // INICIALIZAR BASE DE DATOS
    await initializeDatabase();

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
    - /api/health (Health Check)
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
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Ejecutar servidor
startServer();

export default app;
"// updated" 
