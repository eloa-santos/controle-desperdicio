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
