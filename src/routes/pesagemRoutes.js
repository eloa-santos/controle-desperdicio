const { Router } = require('express');
const pesagemController = require('../controllers/pesagemController');

const router = Router();

router.get('/', (req, res, next) => pesagemController.listar(req, res, next));
router.get('/:codigo', (req, res, next) => pesagemController.buscarPorCodigo(req, res, next));
router.post('/', (req, res, next) => pesagemController.criar(req, res, next));
router.put('/:codigo', (req, res, next) => pesagemController.atualizar(req, res, next));
router.delete('/:codigo', (req, res, next) => pesagemController.excluir(req, res, next));

module.exports = router;
