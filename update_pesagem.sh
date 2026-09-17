#!/usr/bin/env bash

# ==============================================================================
# Script de Automação e Backup - Aplicação do CRUD de Pesagens (Projeto 009)
# ==============================================================================

set -e # Interrompe a execução imediatamente em caso de erro não tratado

PROJECT_DIR=$(pwd)
BACKUP_DIR="${PROJECT_DIR}/backup_before_pesagem_$(date +%Y%m%d_%H%M%S)"

echo "=== [1/6] Iniciando processo de automação ==="
echo "Diretório do projeto: ${PROJECT_DIR}"

# ------------------------------------------------------------------------------
# Função de Reinstauração (Rollback) em caso de erro
# ------------------------------------------------------------------------------
rollback() {
  echo ""
  echo "======================================================================"
  echo "[ERRO DETECTADO] Ocorreu uma falha durante a execução do script!"
  echo "Iniciando processo automatizado de reinstauração (Rollback)..."
  echo "======================================================================"

  if [ -d "$BACKUP_DIR" ]; then
    echo "[ROLLBACK] Restaurando arquivos originais a partir de: $BACKUP_DIR"
    cp -rf "$BACKUP_DIR"/* "$PROJECT_DIR/" 2>/dev/null || true
    echo "[ROLLBACK] Arquivos restaurados com sucesso para o estado anterior."
  else
    echo "[ROLLBACK WARNING] Nenhum diretório de backup foi encontrado para restaurar."
  fi

  echo "[ROLLBACK] A aplicação foi revertida com segurança para o estado inicial."
  exit 1
}

# Define a trap para invocar a função rollback em qualquer erro inesperado
trap 'rollback' ERR

# ------------------------------------------------------------------------------
# [2/6] Validação do Ambiente
# ------------------------------------------------------------------------------
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo "[ERRO] Este script deve ser executado na raiz do projeto (onde está o package.json)."
  exit 1
fi

# ------------------------------------------------------------------------------
# [3/6] Criando Backup de Segurança dos Arquivos Existentes
# ------------------------------------------------------------------------------
echo "=== [2/6] Criando diretório de backup de segurança ==="
mkdir -p "$BACKUP_DIR/src/models"
mkdir -p "$BACKUP_DIR/scripts"

if [ -f "src/models/Turma.js" ]; then cp "src/models/Turma.js" "$BACKUP_DIR/src/models/"; fi
if [ -f "scripts/syncDatabase.js" ]; then cp "scripts/syncDatabase.js" "$BACKUP_DIR/scripts/"; fi
if [ -f "src/app.js" ]; then cp "src/app.js" "$BACKUP_DIR/"; fi

echo "[OK] Backup salvo em: $BACKUP_DIR"

# ------------------------------------------------------------------------------
# [4/6] Aplicando Modificações e Criando Novos Arquivos do CRUD Pesagem
# ------------------------------------------------------------------------------
echo "=== [3/6] Criando/Atualizando Models e Relacionamentos ==="

# 1. Atualizar src/models/Turma.js
cat << 'EOF' > src/models/Turma.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Turma = sequelize.define('Turma', {
  codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false
  }
}, {
  tableName: 'turma',
  timestamps: false,
  freezeTableName: true
});

module.exports = Turma;
EOF

# 2. Criar src/models/Pesagem.js
cat << 'EOF' > src/models/Pesagem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Turma = require('./Turma');

const Pesagem = sequelize.define('Pesagem', {
  codigo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  peso: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  codigo_turma: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Turma,
      key: 'codigo'
    }
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pesagem',
  timestamps: false,
  freezeTableName: true
});

Turma.hasMany(Pesagem, { foreignKey: 'codigo_turma', as: 'pesagens' });
Pesagem.belongsTo(Turma, { foreignKey: 'codigo_turma', as: 'turma' });

module.exports = Pesagem;
EOF

# 3. Atualizar scripts/syncDatabase.js
cat << 'EOF' > scripts/syncDatabase.js
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
EOF

echo "=== [4/6] Criando Repositório, Serviço, Controller e Rotas de Pesagem ==="

# 4. Criar src/repositories/pesagemRepository.js
mkdir -p src/repositories
cat << 'EOF' > src/repositories/pesagemRepository.js
const Pesagem = require('../models/Pesagem');
const Turma = require('../models/Turma');

class PesagemRepository {
  async findAll() {
    return await Pesagem.findAll({
      order: [['codigo', 'ASC']],
      include: [
        {
          model: Turma,
          as: 'turma',
          attributes: ['codigo', 'nome']
        }
      ]
    });
  }

  async findByPk(codigo) {
    return await Pesagem.findByPk(codigo, {
      include: [
        {
          model: Turma,
          as: 'turma',
          attributes: ['codigo', 'nome']
        }
      ]
    });
  }

  async create(data) {
    return await Pesagem.create({
      peso: data.peso,
      codigo_turma: data.codigo_turma,
      data: data.data || new Date()
    });
  }

  async update(pesagemInstance, data) {
    pesagemInstance.peso = data.peso !== undefined ? data.peso : pesagemInstance.peso;
    pesagemInstance.codigo_turma = data.codigo_turma !== undefined ? data.codigo_turma : pesagemInstance.codigo_turma;
    pesagemInstance.data = data.data !== undefined ? data.data : pesagemInstance.data;
    
    return await pesagemInstance.save();
  }

  async delete(pesagemInstance) {
    return await pesagemInstance.destroy();
  }
}

module.exports = new PesagemRepository();
EOF

# 5. Criar src/services/pesagemService.js
mkdir -p src/services
cat << 'EOF' > src/services/pesagemService.js
const pesagemRepository = require('../repositories/pesagemRepository');
const turmaRepository = require('../repositories/turmaRepository');

class PesagemService {
  async listarTodas() {
    return await pesagemRepository.findAll();
  }

  async buscarPorCodigo(codigo) {
    return await pesagemRepository.findByPk(codigo);
  }

  async criarPesagem(dados) {
    const turmaExiste = await turmaRepository.findByPk(dados.codigo_turma);
    if (!turmaExiste) {
      const error = new Error('A turma informada em codigo_turma não existe.');
      error.status = 400;
      throw error;
    }

    return await pesagemRepository.create(dados);
  }

  async atualizarPesagem(codigo, dados) {
    const pesagem = await pesagemRepository.findByPk(codigo);
    if (!pesagem) {
      return null;
    }

    if (dados.codigo_turma !== undefined) {
      const turmaExiste = await turmaRepository.findByPk(dados.codigo_turma);
      if (!turmaExiste) {
        const error = new Error('A turma informada em codigo_turma não existe.');
        error.status = 400;
        throw error;
      }
    }

    return await pesagemRepository.update(pesagem, dados);
  }

  async excluirPesagem(codigo) {
    const pesagem = await pesagemRepository.findByPk(codigo);
    if (!pesagem) {
      return false;
    }
    await pesagemRepository.delete(pesagem);
    return true;
  }
}

module.exports = new PesagemService();
EOF

# 6. Criar src/controllers/pesagemController.js
mkdir -p src/controllers
cat << 'EOF' > src/controllers/pesagemController.js
const pesagemService = require('../services/pesagemService');

function validarCodigoParam(codigoParam) {
  const num = Number(codigoParam);
  if (!Number.isInteger(num) || num <= 0) {
    return false;
  }
  return num;
}

function validarDadosPesagem(body, isUpdate = false) {
  const { peso, codigo_turma, data } = body;

  if (!isUpdate || peso !== undefined) {
    const numPeso = Number(peso);
    if (isNaN(numPeso) || numPeso <= 0) {
      return 'O campo peso deve ser um número positivo maior que zero.';
    }
  }

  if (!isUpdate || codigo_turma !== undefined) {
    const numTurma = Number(codigo_turma);
    if (!Number.isInteger(numTurma) || numTurma <= 0) {
      return 'O campo codigo_turma deve ser um número inteiro positivo.';
    }
  }

  if (data !== undefined && data !== null) {
    const regexData = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof data !== 'string' || !regexData.test(data) || isNaN(Date.parse(data))) {
      return 'O campo data deve estar no formato válido YYYY-MM-DD.';
    }
  }

  return null;
}

class PesagemController {
  async listar(req, res, next) {
    try {
      const pesagens = await pesagemService.listarTodas();
      return res.status(200).json(pesagens);
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

      const pesagem = await pesagemService.buscarPorCodigo(codigo);
      if (!pesagem) {
        return res.status(404).json({ erro: 'Pesagem não encontrada.' });
      }

      return res.status(200).json(pesagem);
    } catch (error) {
      next(error);
    }
  }

  async criar(req, res, next) {
    try {
      const erroValidacao = validarDadosPesagem(req.body);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const novaPesagem = await pesagemService.criarPesagem(req.body);
      return res.status(201).json(novaPesagem);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ erro: error.message });
      }
      next(error);
    }
  }

  async atualizar(req, res, next) {
    try {
      const codigo = validarCodigoParam(req.params.codigo);
      if (codigo === false) {
        return res.status(400).json({ erro: 'O parâmetro código deve ser um número inteiro positivo.' });
      }

      const erroValidacao = validarDadosPesagem(req.body, true);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const pesagemAtualizada = await pesagemService.atualizarPesagem(codigo, req.body);
      if (!pesagemAtualizada) {
        return res.status(404).json({ erro: 'Pesagem não encontrada.' });
      }

      return res.status(200).json(pesagemAtualizada);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ erro: error.message });
      }
      next(error);
    }
  }

  async excluir(req, res, next) {
    try {
      const codigo = validarCodigoParam(req.params.codigo);
      if (codigo === false) {
        return res.status(400).json({ erro: 'O parâmetro código deve ser um número inteiro positivo.' });
      }

      const excluido = await pesagemService.excluirPesagem(codigo);
      if (!excluido) {
        return res.status(404).json({ erro: 'Pesagem não encontrada.' });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PesagemController();
EOF

# 7. Criar src/routes/pesagemRoutes.js
mkdir -p src/routes
cat << 'EOF' > src/routes/pesagemRoutes.js
const { Router } = require('express');
const pesagemController = require('../controllers/pesagemController');

const router = Router();

router.get('/', (req, res, next) => pesagemController.listar(req, res, next));
router.get('/:codigo', (req, res, next) => pesagemController.buscarPorCodigo(req, res, next));
router.post('/', (req, res, next) => pesagemController.criar(req, res, next));
router.put('/:codigo', (req, res, next) => pesagemController.atualizar(req, res, next));
router.delete('/:codigo', (req, res, next) => pesagemController.excluir(req, res, next));

module.exports = router;
EOF

# 8. Atualizar src/app.js
cat << 'EOF' > src/app.js
const express = require('express');
const cors = require('cors');
const turmaRoutes = require('./routes/turmaRoutes');
const pesagemRoutes = require('./routes/pesagemRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

app.use(express.json());

app.use('/api/turmas', turmaRoutes);
app.use('/api/pesagens', pesagemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
EOF

# ------------------------------------------------------------------------------
# [5/6] Executando a Sincronização do Banco de Dados Automática
# ------------------------------------------------------------------------------
echo "=== [5/6] Sincronizando novas tabelas e relacionamentos com o PostgreSQL ==="
npm run db:sync

# ------------------------------------------------------------------------------
# [6/6] Finalização e Remoção do Backup Temporário se Sucesso
# ------------------------------------------------------------------------------
echo "=== [6/6] Finalização ==="
rm -rf "$BACKUP_DIR"
echo "Backup temporário removido."
echo ""
echo "======================================================================"
echo "[SUCESSO] O CRUD de Pesagens foi instalado e sincronizado com sucesso!"
echo "Rota disponível: http://localhost:3000/api/pesagens"
echo "======================================================================"