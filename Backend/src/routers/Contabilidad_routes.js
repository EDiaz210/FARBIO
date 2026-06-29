import express from 'express';
import {
  updateContabilidadCodigo,
  retornoCodigosContabilidad
} from '../controllers/Contabilidad_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();


//PUT - Actualizar partes del código - CONTABILIDAD
// La ruta es PUT /api/contabilidad/update/:id
router.put('/update/:id', verificarTokenJWT, updateContabilidadCodigo);

//POST - Retornar código a Compras - CONTABILIDAD
// La ruta es POST /api/contabilidad/retorno
router.post('/retorno', verificarTokenJWT, retornoCodigosContabilidad);

export default router;