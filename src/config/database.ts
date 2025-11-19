import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('Conectando a BD con:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
});

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
