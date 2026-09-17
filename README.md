# Projeto 009 - API REST do Sistema de Monitoramento do Desperdício de Alimentos

Esta é a versão inicial da API REST em N-Camadas focada no cadastro de turmas.

## Requisitos Prévios
- Node.js (v18+)
- PostgreSQL (v12+)

## Instalação e Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o arquivo `.env`:
   Copie `.env.example` para `.env` e ajuste as credenciais do PostgreSQL:
   ```bash
   cp .env.example .env
   ```

3. Provisione o Banco de Dados e Crie a Tabela:
   ```bash
   npm run db:create
   npm run db:sync
   ```

## Execução

- **Desenvolvimento**:
  ```bash
  npm run dev
  ```
- **Produção**:
  ```bash
  npm start
  ```

## Testes

- **Executar Testes de Integração**:
  ```bash
  npm test
  ```
- **Executar Cliente de Exemplo Axios**:
  ```bash
  node examples/axios-client.js
  ```
