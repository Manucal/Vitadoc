import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parsear DATABASE_URL o construir connectionString desde variables individuales
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Conectando a BD con:', {
  host: process.env.DB_HOST || 'from DATABASE_URL',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'from DATABASE_URL',
  user: process.env.DB_USER || 'from DATABASE_URL',
});

export const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('❌ Error en conexión de base de datos:', err.message);
});

pool.on('connect', () => {
  console.log('✅ Conexión a base de datos establecida');
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = async (): Promise<PoolClient> => await pool.connect();
