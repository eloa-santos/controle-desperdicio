const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Testes de Integração - Endpoints CRUD /api/turmas', () => {
  let codigoTurmaTeste;

  test('GET /api/turmas - Deve retornar lista vazia inicialmente', async () => {
    const res = await request(app).get('/api/turmas');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/turmas - Deve cadastrar uma nova turma com sucesso', async () => {
    const res = await request(app)
      .post('/api/turmas')
      .send({ nome: '3A' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('codigo');
    expect(res.body.nome).toBe('3A');
    codigoTurmaTeste = res.body.codigo;
  });

  test('POST /api/turmas - Deve retornar 400 se o nome for vazio', async () => {
    const res = await request(app)
      .post('/api/turmas')
      .send({ nome: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('GET /api/turmas/:codigo - Deve consultar a turma existente', async () => {
    const res = await request(app).get(`/api/turmas/${codigoTurmaTeste}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.codigo).toBe(codigoTurmaTeste);
    expect(res.body.nome).toBe('3A');
  });

  test('GET /api/turmas/:codigo - Deve retornar 400 para código inválido', async () => {
    const res = await request(app).get('/api/turmas/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('erro');
  });

  test('GET /api/turmas/:codigo - Deve retornar 404 para turma inexistente', async () => {
    const res = await request(app).get('/api/turmas/99999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });

  test('PUT /api/turmas/:codigo - Deve atualizar a turma com sucesso', async () => {
    const res = await request(app)
      .put(`/api/turmas/${codigoTurmaTeste}`)
      .send({ nome: '3B' });

    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('3B');
  });

  test('DELETE /api/turmas/:codigo - Deve excluir a turma com sucesso', async () => {
    const res = await request(app).delete(`/api/turmas/${codigoTurmaTeste}`);
    expect(res.statusCode).toBe(204);
  });

  test('GET /api/turmas/:codigo - Deve retornar 404 ao consultar registro excluído', async () => {
    const res = await request(app).get(`/api/turmas/${codigoTurmaTeste}`);
    expect(res.statusCode).toBe(404);
  });
});
