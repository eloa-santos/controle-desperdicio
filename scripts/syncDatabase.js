const sequelize = require('../src/config/database');
require('../src/models/Turma');
require('../src/models/Pesagem');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('[INFO] Conexão com o PostgreSQL estabelecida para sincronização.');
    
    await sequelize.sync();
    console.log('[INFO] Tabelas "turma" e "pesagem" sincronizadas com sucesso no banco de dados.');
    process.exit(0);
  } catch (error) {
    console.error(`[ERRO] Falha ao sincronizar tabelas: ${error.message}`);
    process.exit(1);
  }
}

syncDatabase();
