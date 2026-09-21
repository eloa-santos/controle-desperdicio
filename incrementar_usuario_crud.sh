#!/usr/bin/env bash
set -euo pipefail

# ================================================================
# Incremento do projeto controle-desperdicio-main
# Recurso: CRUD completo de Usuario
#
# Execute este script NA RAIZ do projeto:
#   chmod +x incrementar_usuario_crud.sh
#   ./incrementar_usuario_crud.sh
#
# O script:
# 1. Faz backup dos arquivos que serao alterados.
# 2. Instala bcrypt para armazenamento seguro das senhas.
# 3. Cria Model, Repository, Service, Controller e Routes de Usuario.
# 4. Registra /api/usuarios no app.js.
# 5. Atualiza o script de sincronizacao do banco.
# 6. Cria testes automatizados do CRUD.
#
# Endpoints criados:
#   GET    /api/usuarios
#   GET    /api/usuarios/:codigo
#   POST   /api/usuarios
#   PUT    /api/usuarios/:codigo
#   DELETE /api/usuarios/:codigo
# ================================================================

if [[ ! -f "package.json" || ! -d "src" ]]; then
  echo "[ERRO] Execute este script na raiz do projeto Node.js (onde existe package.json e src/)."
  exit 1
fi

BACKUP_DIR="backup_usuario_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "[INFO] Criando backup em: $BACKUP_DIR"
for file in package.json package-lock.json src/app.js scripts/syncDatabase.js; do
  if [[ -f "$file" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

mkdir -p src/models src/repositories src/services src/controllers src/routes scripts tests

echo "[INFO] Instalando bcrypt..."
if command -v npm >/dev/null 2>&1; then
  npm install bcrypt@^5.1.1
else
  echo "[ERRO] npm nao encontrado. Instale o Node.js/npm e execute novamente."
  exit 1
fi

cat > src/models/Usuario.js <<'JS'
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'usuario',
    validate: {
      isIn: [['admin', 'usuario']]
    }
  }
}, {
  tableName: 'usuario',
  timestamps: false,
  freezeTableName: true
});

module.exports = Usuario;
JS

cat > src/repositories/usuarioRepository.js <<'JS'
const Usuario = require('../models/Usuario');

class UsuarioRepository {
  async findAll() {
    return await Usuario.findAll({
      attributes: { exclude: ['senha'] },
      order: [['codigo', 'ASC']]
    });
  }

  async findByPk(codigo) {
    return await Usuario.findByPk(codigo, {
      attributes: { exclude: ['senha'] }
    });
  }

  async findByPkWithPassword(codigo) {
    return await Usuario.findByPk(codigo);
  }

  async findByEmail(email) {
    return await Usuario.findOne({ where: { email } });
  }

  async create(data) {
    return await Usuario.create(data);
  }

  async update(usuarioInstance, data) {
    usuarioInstance.nome = data.nome;
    usuarioInstance.email = data.email;
    usuarioInstance.tipo = data.tipo;

    if (data.senha) {
      usuarioInstance.senha = data.senha;
    }

    await usuarioInstance.save();

    return await this.findByPk(usuarioInstance.codigo);
  }

  async delete(usuarioInstance) {
    return await usuarioInstance.destroy();
  }
}

module.exports = new UsuarioRepository();
JS

cat > src/services/usuarioService.js <<'JS'
const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');

const SALT_ROUNDS = 10;

class UsuarioService {
  async listarTodos() {
    return await usuarioRepository.findAll();
  }

  async buscarPorCodigo(codigo) {
    return await usuarioRepository.findByPk(codigo);
  }

  async criarUsuario(dados) {
    const email = dados.email.trim().toLowerCase();
    const existente = await usuarioRepository.findByEmail(email);

    if (existente) {
      const erro = new Error('Já existe um usuário cadastrado com este e-mail.');
      erro.status = 409;
      throw erro;
    }

    const senhaHash = await bcrypt.hash(dados.senha, SALT_ROUNDS);

    const usuario = await usuarioRepository.create({
      nome: dados.nome.trim(),
      email,
      senha: senhaHash,
      tipo: dados.tipo || 'usuario'
    });

    return {
      codigo: usuario.codigo,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    };
  }

  async atualizarUsuario(codigo, dados) {
    const usuario = await usuarioRepository.findByPkWithPassword(codigo);

    if (!usuario) {
      return null;
    }

    const email = dados.email.trim().toLowerCase();
    const outroUsuario = await usuarioRepository.findByEmail(email);

    if (outroUsuario && outroUsuario.codigo !== codigo) {
      const erro = new Error('Já existe um usuário cadastrado com este e-mail.');
      erro.status = 409;
      throw erro;
    }

    const dadosAtualizacao = {
      nome: dados.nome.trim(),
      email,
      tipo: dados.tipo
    };

    if (dados.senha !== undefined && dados.senha !== null && dados.senha !== '') {
      dadosAtualizacao.senha = await bcrypt.hash(dados.senha, SALT_ROUNDS);
    }

    return await usuarioRepository.update(usuario, dadosAtualizacao);
  }

  async excluirUsuario(codigo) {
    const usuario = await usuarioRepository.findByPkWithPassword(codigo);

    if (!usuario) {
      return false;
    }

    await usuarioRepository.delete(usuario);
    return true;
  }
}

module.exports = new UsuarioService();
JS

cat > src/controllers/usuarioController.js <<'JS'
const usuarioService = require('../services/usuarioService');

function validarCodigoParam(codigoParam) {
  const codigo = Number(codigoParam);
  return Number.isInteger(codigo) && codigo > 0 ? codigo : false;
}

function validarNome(nome) {
  if (typeof nome !== 'string' || nome.trim().length === 0) {
    return 'O campo nome deve ser um texto não vazio.';
  }
  if (nome.trim().length > 120) {
    return 'O campo nome deve ter no máximo 120 caracteres.';
  }
  return null;
}

function validarEmail(email) {
  if (typeof email !== 'string' || email.trim().length === 0) {
    return 'O campo email é obrigatório.';
  }

  const valor = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(valor)) {
    return 'O campo email deve possuir um formato válido.';
  }
  if (valor.length > 150) {
    return 'O campo email deve ter no máximo 150 caracteres.';
  }
  return null;
}

function validarSenha(senha, obrigatoria = true) {
  if (!obrigatoria && (senha === undefined || senha === null || senha === '')) {
    return null;
  }
  if (typeof senha !== 'string' || senha.length === 0) {
    return 'O campo senha é obrigatório.';
  }
  if (senha.length < 6) {
    return 'A senha deve possuir pelo menos 6 caracteres.';
  }
  if (senha.length > 72) {
    return 'A senha deve possuir no máximo 72 caracteres.';
  }
  return null;
}

function validarTipo(tipo) {
  if (!['admin', 'usuario'].includes(tipo)) {
    return 'O campo tipo deve ser "admin" ou "usuario".';
  }
  return null;
}

class UsuarioController {
  async listar(req, res, next) {
    try {
      return res.status(200).json(await usuarioService.listarTodos());
    } catch (error) {
      next(error);
    }
  }

  async buscarPorCodigo(req, res, next) {
    try {
      const codigo = validarCodigoParam(req.params.codigo);
      if (codigo === false) {
        return res.status(400).json({ erro: 'O parâmetro código deve ser um número inteiro positivo.' });
      }

      const usuario = await usuarioService.buscarPorCodigo(codigo);
      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async criar(req, res, next) {
    try {
      const { nome, email, senha, tipo = 'usuario' } = req.body;

      const erroNome = validarNome(nome);
      if (erroNome) return res.status(400).json({ erro: erroNome });

      const erroEmail = validarEmail(email);
      if (erroEmail) return res.status(400).json({ erro: erroEmail });

      const erroSenha = validarSenha(senha, true);
      if (erroSenha) return res.status(400).json({ erro: erroSenha });

      const erroTipo = validarTipo(tipo);
      if (erroTipo) return res.status(400).json({ erro: erroTipo });

      const usuario = await usuarioService.criarUsuario({ nome, email, senha, tipo });
      return res.status(201).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async atualizar(req, res, next) {
    try {
      const codigo = validarCodigoParam(req.params.codigo);
      if (codigo === false) {
        return res.status(400).json({ erro: 'O parâmetro código deve ser um número inteiro positivo.' });
      }

      const { nome, email, senha, tipo } = req.body;

      const erroNome = validarNome(nome);
      if (erroNome) return res.status(400).json({ erro: erroNome });

      const erroEmail = validarEmail(email);
      if (erroEmail) return res.status(400).json({ erro: erroEmail });

      const erroSenha = validarSenha(senha, false);
      if (erroSenha) return res.status(400).json({ erro: erroSenha });

      const erroTipo = validarTipo(tipo);
      if (erroTipo) return res.status(400).json({ erro: erroTipo });

      const usuario = await usuarioService.atualizarUsuario(codigo, {
        nome,
        email,
        senha,
        tipo
      });

      if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async excluir(req, res, next) {
    try {
      const codigo = validarCodigoParam(req.params.codigo);
      if (codigo === false) {
        return res.status(400).json({ erro: 'O parâmetro código deve ser um número inteiro positivo.' });
      }

      const excluido = await usuarioService.excluirUsuario(codigo);
      if (!excluido) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();
JS

cat > src/routes/usuarioRoutes.js <<'JS'
const { Router } = require('express');
const usuarioController = require('../controllers/usuarioController');

const router = Router();

router.get('/', (req, res, next) => usuarioController.listar(req, res, next));
router.get('/:codigo', (req, res, next) => usuarioController.buscarPorCodigo(req, res, next));
router.post('/', (req, res, next) => usuarioController.criar(req, res, next));
router.put('/:codigo', (req, res, next) => usuarioController.atualizar(req, res, next));
router.delete('/:codigo', (req, res, next) => usuarioController.excluir(req, res, next));

module.exports = router;
JS

node <<'JS'
const fs = require('fs');

const appPath = 'src/app.js';
let app = fs.readFileSync(appPath, 'utf8');
if (!app.includes("require('./routes/usuarioRoutes')")) {
  app = app.replace(
    "const pesagemRoutes = require('./routes/pesagemRoutes');",
    "const pesagemRoutes = require('./routes/pesagemRoutes');\nconst usuarioRoutes = require('./routes/usuarioRoutes');"
  );
}
if (!app.includes("app.use('/api/usuarios', usuarioRoutes);")) {
  app = app.replace(
    "app.use('/api/pesagens', pesagemRoutes);",
    "app.use('/api/pesagens', pesagemRoutes);\napp.use('/api/usuarios', usuarioRoutes);"
  );
}
fs.writeFileSync(appPath, app);

const syncPath = 'scripts/syncDatabase.js';
let sync = fs.readFileSync(syncPath, 'utf8');
if (!sync.includes("require('../src/models/Usuario')")) {
  sync = sync.replace(
    "require('../src/models/Pesagem');",
    "require('../src/models/Pesagem');\nrequire('../src/models/Usuario');"
  );
}
sync = sync.replace(
  /Tabelas "turma" e "pesagem" sincronizadas com sucesso no banco de dados\./,
  'Tabelas "turma", "pesagem" e "usuario" sincronizadas com sucesso no banco de dados.'
);
fs.writeFileSync(syncPath, sync);
JS

cat > tests/usuario.test.js <<'JS'
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

beforeAll(async () => {
  await sequelize.authenticate();
  await Usuario.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('CRUD de Usuario', () => {
  let codigo;

  test('POST /api/usuarios - deve criar usuário', async () => {
    const response = await request(app)
      .post('/api/usuarios')
      .send({
        nome: 'Usuário Teste',
        email: 'teste.usuario@example.com',
        senha: '123456',
        tipo: 'usuario'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('codigo');
    expect(response.body.email).toBe('teste.usuario@example.com');
    expect(response.body).not.toHaveProperty('senha');

    codigo = response.body.codigo;

    const registro = await Usuario.findByPk(codigo);
    expect(registro).not.toBeNull();
    expect(registro.senha).not.toBe('123456');
    expect(await bcrypt.compare('123456', registro.senha)).toBe(true);
  });

  test('GET /api/usuarios - deve listar usuários sem senha', async () => {
    const response = await request(app).get('/api/usuarios');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).not.toHaveProperty('senha');
  });

  test('GET /api/usuarios/:codigo - deve buscar usuário', async () => {
    const response = await request(app).get(`/api/usuarios/${codigo}`);

    expect(response.status).toBe(200);
    expect(response.body.codigo).toBe(codigo);
    expect(response.body).not.toHaveProperty('senha');
  });

  test('PUT /api/usuarios/:codigo - deve atualizar usuário', async () => {
    const response = await request(app)
      .put(`/api/usuarios/${codigo}`)
      .send({
        nome: 'Usuário Atualizado',
        email: 'atualizado.usuario@example.com',
        senha: '654321',
        tipo: 'admin'
      });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Usuário Atualizado');
    expect(response.body.tipo).toBe('admin');
    expect(response.body).not.toHaveProperty('senha');
  });

  test('DELETE /api/usuarios/:codigo - deve excluir usuário', async () => {
    const response = await request(app).delete(`/api/usuarios/${codigo}`);

    expect(response.status).toBe(204);

    const busca = await request(app).get(`/api/usuarios/${codigo}`);
    expect(busca.status).toBe(404);
  });
});
JS

cat > scripts/usuarioSeed.js <<'JS'
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
JS

node <<'JS'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['db:seed:usuario'] = 'node scripts/usuarioSeed.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
JS

cat <<'INFO'

===============================================================
[OK] CRUD de Usuario integrado ao projeto.

Arquivos adicionados:
  src/models/Usuario.js
  src/repositories/usuarioRepository.js
  src/services/usuarioService.js
  src/controllers/usuarioController.js
  src/routes/usuarioRoutes.js
  scripts/usuarioSeed.js
  tests/usuario.test.js

Arquivos atualizados:
  src/app.js
  scripts/syncDatabase.js
  package.json
  package-lock.json

Banco:
  Tabela: usuario
  Campos: codigo, nome, email, senha, tipo
  email: UNIQUE
  senha: armazenada com bcrypt

Endpoints:
  GET    /api/usuarios
  GET    /api/usuarios/:codigo
  POST   /api/usuarios
  PUT    /api/usuarios/:codigo
  DELETE /api/usuarios/:codigo

Comandos recomendados:
  npm install
  npm run db:sync
  npm test

Opcional - criar administrador inicial:
  npm run db:seed:usuario

Exemplo de POST:
  {
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "123456",
    "tipo": "usuario"
  }

Backup dos arquivos anteriores: $BACKUP_DIR
===============================================================
INFO
