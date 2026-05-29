import express from 'express';
import { 
  obtenerVatGroups, 
  obtenerItemsGroups, 
  obtenerItems,
  buscarItemSAP
} from '../controllers/SAP_controllers.js';

const router = express.Router();

// GET - Obtener grupos de IVA de SAP
// La ruta es /api/sap/vat-groups
router.get('/vat-groups', obtenerVatGroups);

// GET - Obtener grupos de artículos de SAP
// La ruta es /api/sap/items-groups
router.get('/items-groups', obtenerItemsGroups);

// GET - Obtener items de SAP
// La ruta es /api/sap/items
router.get('/items', obtenerItems);

// GET - Buscar un item específico de SAP por código
// La ruta es /api/sap/items/:itemCode
router.get('/items/:itemCode', buscarItemSAP);


export default router;
