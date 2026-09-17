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
