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
