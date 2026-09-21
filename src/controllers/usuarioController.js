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
