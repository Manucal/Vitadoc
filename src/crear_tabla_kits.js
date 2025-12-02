import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config(); // Carga las variables del .env

const { Pool } = pg;

// Configuración manual usando las variables que SÍ detectó tu consola
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS treatment_kits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        medicines JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_kits_user ON treatment_kits(user_id);
`;

const run = async () => {
    try {
        console.log("⏳ Conectando a la base de datos...");
        await pool.query(createTableQuery);
        console.log("✅ ¡Tabla 'treatment_kits' creada con éxito!");
    } catch (error) {
        console.error("❌ Error al crear la tabla:", error);
    } finally {
        await pool.end();
    }
};

run();