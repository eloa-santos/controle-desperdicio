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
