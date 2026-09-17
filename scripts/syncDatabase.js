const sequelize = require('../src/config/database');
require('../src/models/Turma');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('[INFO] Conexão com o PostgreSQL estabelecida para sincronização.');
    
    // Sincronização segura: cria a tabela turma se não existir, sem apagar dados
    await sequelize.sync();
    console.log('[INFO] Tabela "turma" sincronizada com sucesso no banco de dados.');
    process.exit(0);
  } catch (error) {
    console.error(`[ERRO] Falha ao sincronizar tabelas: ${error.message}`);
    process.exit(1);
  }
}

syncDatabase();
