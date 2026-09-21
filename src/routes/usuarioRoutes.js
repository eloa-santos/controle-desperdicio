const { Router } = require('express');
const usuarioController = require('../controllers/usuarioController');

const router = Router();

router.get('/', (req, res, next) => usuarioController.listar(req, res, next));
router.get('/:codigo', (req, res, next) => usuarioController.buscarPorCodigo(req, res, next));
router.post('/', (req, res, next) => usuarioController.criar(req, res, next));
router.put('/:codigo', (req, res, next) => usuarioController.atualizar(req, res, next));
router.delete('/:codigo', (req, res, next) => usuarioController.excluir(req, res, next));

module.exports = router;
