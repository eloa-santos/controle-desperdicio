const bcrypt = require('bcrypt');
const sequelize = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

async function seed() {
  try {
    await sequelize.authenticate();
    await Usuario.sync();

    const email = 'admin@ecoscales.local';
    const senha = '123456';

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      console.log('[INFO] Usuário administrador já existe.');
      return;
    }

    await Usuario.create({
      nome: 'Administrador',
      email,
      senha: await bcrypt.hash(senha, 10),
      tipo: 'admin'
    });

    console.log('[INFO] Usuário administrador criado.');
    console.log(`[INFO] E-mail: ${email}`);
    console.log(`[INFO] Senha inicial: ${senha}`);
    console.log('[ATENCAO] Troque a senha antes de usar em produção.');
  } finally {
    await sequelize.close();
  }
}

seed().catch((error) => {
  console.error(`[ERRO] ${error.message}`);
  process.exit(1);
});
