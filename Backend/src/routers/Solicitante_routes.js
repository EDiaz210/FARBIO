import express from 'express';
import {createCodigo,
  updateSolicitante,
  getSolicitudesPorUsuario
} from '../controllers/Solicitante_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();


// POST - Crear código - SOLICITANTE
// La ruta es /api/solicitante/codigos/create
router.post('/codigos/create', verificarTokenJWT, createCodigo);
//PUT - Actualizar código - SOLICITANTE
// La ruta es /api/solicitante/codigos/:id
router.put('/codigos/:id', verificarTokenJWT, updateSolicitante);
//GET - Solicitudes por Solicitante
// La ruta es /api/solicitante/codigos/propios/:userid
router.get('/codigos/propios/:userid',verificarTokenJWT, getSolicitudesPorUsuario);


export default router;