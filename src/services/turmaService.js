const turmaRepository = require('../repositories/turmaRepository');

class TurmaService {
  async listarTodas() {
    return await turmaRepository.findAll();
  }

  async buscarPorCodigo(codigo) {
    return await turmaRepository.findByPk(codigo);
  }

  async criarTurma(dados) {
    return await turmaRepository.create(dados);
  }

  async atualizarTurma(codigo, dados) {
    const turma = await turmaRepository.findByPk(codigo);
    if (!turma) {
      return null;
    }
    return await turmaRepository.update(turma, dados);
  }

  async excluirTurma(codigo) {
    const turma = await turmaRepository.findByPk(codigo);
    if (!turma) {
      return false;
    }
    await turmaRepository.delete(turma);
    return true;
  }
}

module.exports = new TurmaService();
