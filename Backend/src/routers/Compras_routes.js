import express from 'express';
import {
  updateComprasCodigo,
  retornoCodigosCompras
} from '../controllers/Compras_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();

//PUT - Actualizar partes del código - COMPRAS
// La ruta es PUT /api/compras/update/:id
router.put('/update/:id', verificarTokenJWT, updateComprasCodigo);
//POST - Retornar código a Solicitante - COMPRAS
// La ruta es POST /api/compras/retorno
router.post('/retorno', verificarTokenJWT, retornoCodigosCompras);

export default router;