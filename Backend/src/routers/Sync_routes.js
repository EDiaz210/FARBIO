import express from 'express';
import { syncSapToMysql } from '../controllers/Sync_controllers.js';

const router = express.Router();

// POST - Dispara sincronización SAP -> MySQL (ejecuta una pasada)
router.post('/sap-to-mysql', syncSapToMysql);

export default router;
