function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ erro: 'JSON enviado na requisição é inválido.' });
  }

  console.error('[ERRO INTERNO NO SERVIDOR]:', err.message);
  return res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
}

function notFoundHandler(req, res) {
  return res.status(404).json({ erro: 'Rota não encontrada.' });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
