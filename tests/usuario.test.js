const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const Usuario = require('../src/models/Usuario');

beforeAll(async () => {
  await sequelize.authenticate();
  await Usuario.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('CRUD de Usuario', () => {
  let codigo;

  test('POST /api/usuarios - deve criar usuário', async () => {
    const response = await request(app)
      .post('/api/usuarios')
      .send({
        nome: 'Usuário Teste',
        email: 'teste.usuario@example.com',
        senha: '123456',
        tipo: 'usuario'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('codigo');
    expect(response.body.email).toBe('teste.usuario@example.com');
    expect(response.body).not.toHaveProperty('senha');

    codigo = response.body.codigo;

    const registro = await Usuario.findByPk(codigo);
    expect(registro).not.toBeNull();
    expect(registro.senha).not.toBe('123456');
    expect(await bcrypt.compare('123456', registro.senha)).toBe(true);
  });

  test('GET /api/usuarios - deve listar usuários sem senha', async () => {
    const response = await request(app).get('/api/usuarios');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).not.toHaveProperty('senha');
  });

  test('GET /api/usuarios/:codigo - deve buscar usuário', async () => {
    const response = await request(app).get(`/api/usuarios/${codigo}`);

    expect(response.status).toBe(200);
    expect(response.body.codigo).toBe(codigo);
    expect(response.body).not.toHaveProperty('senha');
  });

  test('PUT /api/usuarios/:codigo - deve atualizar usuário', async () => {
    const response = await request(app)
      .put(`/api/usuarios/${codigo}`)
      .send({
        nome: 'Usuário Atualizado',
        email: 'atualizado.usuario@example.com',
        senha: '654321',
        tipo: 'admin'
      });

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Usuário Atualizado');
    expect(response.body.tipo).toBe('admin');
    expect(response.body).not.toHaveProperty('senha');
  });

  test('DELETE /api/usuarios/:codigo - deve excluir usuário', async () => {
    const response = await request(app).delete(`/api/usuarios/${codigo}`);

    expect(response.status).toBe(204);

    const busca = await request(app).get(`/api/usuarios/${codigo}`);
    expect(busca.status).toBe(404);
  });
});
