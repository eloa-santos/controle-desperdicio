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
