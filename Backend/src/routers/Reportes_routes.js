import express from 'express';
import { obtenerTiempoEsperaSAP } from '../controllers/Reportes_controllers.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = express.Router();

// GET - Tiempo de espera desde creación hasta envío a SAP
// Ruta: /api/reportes/tiempo-espera o /api/reportes/tiempo-espera/:id
router.get('/tiempo-espera/:id?', verificarTokenJWT, obtenerTiempoEsperaSAP);

export default router;