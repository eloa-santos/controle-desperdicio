const turmaService = require('../services/turmaService');

function validarNome(nome) {
  if (typeof nome !== 'string') {
    return 'O campo nome deve ser um texto não vazio.';
  }
  const nomeTrimmed = nome.trim();
  if (nomeTrimmed.length === 0) {
    return 'O campo nome deve ser um texto não vazio.';
  }
  if (nomeTrimmed.length > 120) {
    return 'O campo nome deve ter no máximo 120 caracteres.';
  }
  return null;
}

function validarCodigoParam(codigoParam) {
  const num = Number(codigoParam);
  if (!Number.isInteger(num) || num <= 0) {
    return false;
  }
  return num;
}

class TurmaController {
  async listar(req, res, next) {
    try {
      const turmas = await turmaService.listarTodas();
      return res.status(200).json(turmas);
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

      const turma = await turmaService.buscarPorCodigo(codigo);
      if (!turma) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      return res.status(200).json(turma);
    } catch (error) {
      next(error);
    }
  }

  async criar(req, res, next) {
    try {
      const { nome } = req.body;
      const erroValidacao = validarNome(nome);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const novaTurma = await turmaService.criarTurma({ nome: nome.trim() });
      return res.status(201).json(novaTurma);
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

      const { nome } = req.body;
      const erroValidacao = validarNome(nome);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const turmaAtualizada = await turmaService.atualizarTurma(codigo, { nome: nome.trim() });
      if (!turmaAtualizada) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      return res.status(200).json(turmaAtualizada);
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

      const excluido = await turmaService.excluirTurma(codigo);
      if (!excluido) {
        return res.status(404).json({ erro: 'Turma não encontrada.' });
      }

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TurmaController();
