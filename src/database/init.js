import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    // Leer el archivo schema.sql
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
    
    // En producción (Railway), el archivo está en /app/src/database/schema.sql
    const actualPath = fs.existsSync(schemaPath) 
      ? schemaPath 
      : '/app/src/database/schema.sql';
    
    if (!fs.existsSync(actualPath)) {
      console.warn('⚠️ schema.sql no encontrado, saltando inicialización');
      return;
    }
    
    const schema = fs.readFileSync(actualPath, 'utf-8');
    
    console.log('🔄 Inicializando base de datos...');
    await pool.query(schema);
    
    console.log('✅ Base de datos inicializada exitosamente');
  } catch (error) {
    console.error('❌ Error al inicializar BD:', error);
    // No lanzamos error para que el servidor siga corriendo
    // (las tablas pueden ya existir)
  }
};
