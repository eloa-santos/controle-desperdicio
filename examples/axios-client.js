const axios = require('axios');

const API_URL = 'http://localhost:3000/api/turmas';

async function executarExemplos() {
  try {
    console.log('--- 1. POST: Cadastrando Turma "3A" ---');
    const postRes = await axios.post(API_URL, { nome: '3A' });
    console.log('Resposta Status:', postRes.status);
    console.log('Corpo:', postRes.data);
    const codigoCriado = postRes.data.codigo;

    console.log('\n--- 2. GET: Listando todas as turmas ---');
    const listRes = await axios.get(API_URL);
    console.log('Status:', listRes.status);
    console.log('Lista:', listRes.data);

    console.log(`\n--- 3. GET por Código: Consultando Turma ${codigoCriado} ---`);
    const getRes = await axios.get(`${API_URL}/${codigoCriado}`);
    console.log('Status:', getRes.status);
    console.log('Dados:', getRes.data);

    console.log(`\n--- 4. PUT: Atualizando Turma ${codigoCriado} para "3B" ---`);
    const putRes = await axios.put(`${API_URL}/${codigoCriado}`, { nome: '3B' });
    console.log('Status:', putRes.status);
    console.log('Dados Atualizados:', putRes.data);

    console.log(`\n--- 5. DELETE: Removendo Turma ${codigoCriado} ---`);
    const delRes = await axios.delete(`${API_URL}/${codigoCriado}`);
    console.log('Status:', delRes.status, '(sem corpo)');

    console.log(`\n--- 6. GET após exclusão (Deve retornar 404) ---`);
    try {
      await axios.get(`${API_URL}/${codigoCriado}`);
    } catch (err) {
      console.log('Status Recebido:', err.response.status);
      console.log('Mensagem de Erro:', err.response.data);
    }

  } catch (error) {
    console.error('Erro na execução:', error.response ? error.response.data : error.message);
  }
}

executarExemplos();
