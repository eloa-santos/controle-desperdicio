const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'db_desperdicio';
  
  // Conexão administrativa no banco padrão 'postgres'
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres'
  });

  try {
    await client.connect();
    
    // Verifica se o banco db_desperdicio já existe
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (res.rowCount === 0) {
      // Cria o banco caso não exista
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[INFO] Banco de dados '${dbName}' criado com sucesso.`);
    } else {
      console.log(`[INFO] O banco de dados '${dbName}' já existe.`);
    }
  } catch (error) {
    console.error(`[ERRO] Falha ao criar/verificar o banco de dados: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
