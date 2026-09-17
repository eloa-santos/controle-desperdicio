const Turma = require('../models/Turma');

class TurmaRepository {
  async findAll() {
    return await Turma.findAll({
      order: [['codigo', 'ASC']]
    });
  }

  async findByPk(codigo) {
    return await Turma.findByPk(codigo);
  }

  async create(data) {
    return await Turma.create({ nome: data.nome });
  }

  async update(turmaInstance, data) {
    turmaInstance.nome = data.nome;
    return await turmaInstance.save();
  }

  async delete(turmaInstance) {
    return await turmaInstance.destroy();
  }
}

module.exports = new TurmaRepository();
