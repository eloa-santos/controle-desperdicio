const app = require('./app');
const sequelize = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[INFO] Conexão com o PostgreSQL autenticada com sucesso.');
    
    app.listen(PORT, () => {
      console.log(`[INFO] Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('[ERRO FATAL] Não foi possível conectar ao banco de dados PostgreSQL:', error.message);
    process.exit(1);
  }
}

startServer();
