import express from 'express';
import {
  updateContabilidadCodigo,
} from '../controllers/Contabilidad_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();


//PUT - Actualizar partes del código - CONTABILIDAD
// La ruta es PUT /api/contabilidad/update/:id
router.put('/update/:id', verificarTokenJWT, updateContabilidadCodigo);

export default router;