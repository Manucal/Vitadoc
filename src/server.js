import express from 'express';
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
import usersRoutes from './routes/users.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS CONFIGURADO CORRECTAMENTE PARA PRODUCCIÓN
const ALLOWED_ORIGINS = {
  production: ['https://vitadoc.com.co', 'https://www.vitadoc.com.co','https://vitadoc-orpin.vercel.app'],
  development: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']
};

const getOrigins = () => {
  return process.env.NODE_ENV === 'production' 
    ? ALLOWED_ORIGINS.production 
    : ALLOWED_ORIGINS.development;
};

app.use(cors({
  origin: getOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// HEALTH CHECK EN RAÍZ
app.get('/', (req, res) => {
  res.json({ 
    status: 'VitaDoc API running ✅', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    version: '3.0.0'
  });
});

// HEALTH CHECK - ENDPOINT PUBLICO
app.get('/api/health', (req, res) => {
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
app.use('/api/users', usersRoutes);

// ERROR 404
app.use((req, res) => {
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

    server.on('error', (error) => {
      console.error('❌ Error en servidor:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
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
