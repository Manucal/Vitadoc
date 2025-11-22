import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 DEBUG - DATABASE_URL:', process.env.DATABASE_URL ? '✅ DEFINIDA' : '❌ UNDEFINED');
console.log('🔍 DEBUG - NODE_ENV:', process.env.NODE_ENV);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL no está definida en las variables de entorno');
  console.error('Variables disponibles:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB') || k.includes('PG')));
}

console.log('Conectando a BD con DATABASE_URL:', connectionString ? '✅ PRESENTE' : '❌ NO PRESENTE');

export const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Error en conexión de base de datos:', err.message);
});

pool.on('connect', () => {
  console.log('✅ Conexión a base de datos establecida');
});

export const query = (text, params) => pool.query(text, params);

export const getClient = async () => await pool.connect();
