import express from 'express';
import {
  updateMaestroDatos,
  obtenerCodigosFinalizadosMaestro,
} from '../controllers/Maestro_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();


// GET - Obtener códigos finalizados para exportación
// La ruta es GET /api/maestro/codigos/finalizados
router.get('/codigos/finalizados', verificarTokenJWT, obtenerCodigosFinalizadosMaestro);

//PUT - Actualizar partes del código - MAESTRO
// La ruta es PUT /api/maestro/codigos/:id
router.put('/codigos/:id', verificarTokenJWT, updateMaestroDatos);
    
export default router;