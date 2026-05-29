import express from 'express';
import {
  updateMaestroDatos,
} from '../controllers/Maestro_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();


//PUT - Actualizar partes del código - MAESTRO
// La ruta es PUT /api/maestro/codigos/:id
router.put('/codigos/:id', verificarTokenJWT, updateMaestroDatos);
    
export default router;