import express from 'express';
import {
  updateComprasCodigo,
} from '../controllers/Compras_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();

//PUT - Actualizar partes del código - COMPRAS
// La ruta es PUT /api/compras/update/:id
router.put('/update/:id', verificarTokenJWT, updateComprasCodigo);

export default router;