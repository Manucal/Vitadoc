import { Request, Response, NextFunction } from 'express';

const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://vitadoc-orpin.vercel.app',        // Tu frontend en Vercel
    'https://vitadoc.com.co',                   // Tu dominio (cuando esté configurado)
    'https://www.vitadoc.com.co',               // Con www
    'http://localhost:5173',                    // Desarrollo local
    'http://localhost:3000',                    // Desarrollo local (si lo usas)
  ];

  const origin = req.headers.origin;

  // Si el origen está en la lista permitida, agregamos el header CORS
  if (allowedOrigins.includes(origin || '')) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

export default corsMiddleware;
