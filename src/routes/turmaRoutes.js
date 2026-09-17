const { Router } = require('express');
const turmaController = require('../controllers/turmaController');

const router = Router();

router.get('/', (req, res, next) => turmaController.listar(req, res, next));
router.get('/:codigo', (req, res, next) => turmaController.buscarPorCodigo(req, res, next));
router.post('/', (req, res, next) => turmaController.criar(req, res, next));
router.put('/:codigo', (req, res, next) => turmaController.atualizar(req, res, next));
router.delete('/:codigo', (req, res, next) => turmaController.excluir(req, res, next));

module.exports = router;
