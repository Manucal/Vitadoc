import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patients.routes';
import medicalVisitsRoutes from './routes/medical-visits.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// HEALTH CHECK (PRIMERO, antes que las rutas)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'VitaDoc API running ✅', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// RUTAS (SEGUNDO)
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-visits', medicalVisitsRoutes);

// ERROR 404 (ÚLTIMO, como fallback)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏥 VITADOC SERVER INICIADO 🏥      ║
╚════════════════════════════════════════╝
  
  Puerto: ${PORT}
  Entorno: ${process.env.NODE_ENV}
  URL: http://localhost:${PORT}
  API: http://localhost:${PORT}/api
  
  Presiona Ctrl+C para detener
  `);
});

export default app;

