import express from 'express';
import {
  obtenerCodigos,
  obtenerCodigoID,
  obtenerMisCodigos,
  eliminarCodigo
} from '../controllers/Codigos_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';
const router = express.Router();

//GET- Obtener códigos creados por el usuario actual
// La ruta es GET /api/codigos/mis-codigos?created_by=ID_USUARIO
router.get('/mis-codigos', verificarTokenJWT, obtenerMisCodigos);
// GET - Obtener un códigos
// La ruta es GET /api/codigos/search
router.get('/search', verificarTokenJWT, obtenerCodigos);
// GET - Obtener un código específico por ID
// La ruta es GET /api/codigos/:id
router.get('/:id', verificarTokenJWT, obtenerCodigoID);
// DELETE - Eliminar un código por ID
// La ruta es DELETE /api/codigos/:id
router.delete('/:id', verificarTokenJWT, eliminarCodigo);

export default router;
