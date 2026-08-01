import axios from 'axios';
import https from 'https';
import pool from '../database.js';
import dotenv from 'dotenv';
import { buildDynamicUpdate } from '../utils/dbHelpers.js';

dotenv.config();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Helper: login to SAP and return sessionId
const loginToSap = async () => {
  const resp = await axios.post(`${process.env.SAP_URL}/Login`, {
    CompanyDB: process.env.SAP_COMPANYDB,
    UserName: process.env.SAP_USERNAME,
    Password: process.env.SAP_PASSWORD
  }, { httpsAgent });

  return resp.data.SessionId;
};

const logoutFromSap = async (sessionId) => {
  await axios.post(`${process.env.SAP_URL}/Logout`, {}, {
    httpsAgent,
    headers: { Cookie: `B1SESSION=${sessionId}` }
  }).catch(() => {});
};

/**
 * Sincroniza codigos desde SAP hacia la base de datos local (MySQL).
 * Recorre la tabla `codigos`, consulta SAP por `ItemCode` y actualiza
 * los campos que difieran.
 */
const syncSapToMysql = async (req, res) => {
  let conn;
  let sessionId;

  try {
    conn = await pool.getConnection();

    const [localRecords] = await conn.query(
      `SELECT id, codigo, descripcion_sap, nombre_extranjero, unidad_medida, lead_time, dias_tolerancia, cantidad_minima_pedido, grupo_articulos, tipo_bien, indicadorIVACompras, indicadorIVAVentas, inventoryItem, salesItem, purchaseItem
       FROM codigos`);

    console.log(`[Sync] ${localRecords.length} registros cargados desde MySQL.`);

    sessionId = await loginToSap();
    console.log('[Sync] Sesión SAP iniciada:', sessionId);

    let updated = 0;
    let skipped = 0;

    for (const localItem of localRecords) {
      const code = (localItem.codigo || '').trim();
      if (!code) {
        skipped++;
        continue;
      }

      // Consultar SAP por el item
      let sapItemsResp;
      try {
        sapItemsResp = await axios.get(`${process.env.SAP_URL}/Items`, {
          params: { '$filter': `ItemCode eq '${code.replace(/'/g, "''")}'`, '$top': 1 },
          httpsAgent,
          headers: { Cookie: `B1SESSION=${sessionId}` }
        });
      } catch (err) {
        console.warn(`[Sync] Error consultando SAP para código ${code}:`, err.message);
        skipped++;
        continue;
      }

      const items = sapItemsResp.data?.value || [];
      if (!items.length) {
        // No existe en SAP -> ignorar
        skipped++;
        continue;
      }

      const sap = items[0];

      // Mapear únicamente los campos indicados (SAP -> MySQL)
      const normalizeBoolToTYes = (val) => {
        if (val === undefined || val === null) return undefined;
        const s = String(val).toLowerCase();
        if (['tyes', 'true', '1', 'y', 'yes'].includes(s)) return 'tYES';
        return 'tNO';
      };

      const sapData = {
        descripcion_sap: sap.ItemName ?? sap.ItemName_L ?? undefined,
        nombre_extranjero: sap.ForeignName ?? sap.ItemForeignName ?? undefined,
        indicadorIVAVentas: sap.ArTaxCode ?? sap.SalesTaxCode ?? sap.SalesVatCode ?? undefined,
        indicadorIVACompras: sap.ApTaxCode ?? sap.PurchaseTaxCode ?? sap.PurchaseVatCode ?? undefined,
        lead_time: sap.LeadTime !== undefined ? Number(sap.LeadTime) : undefined,
        dias_tolerancia: sap.ToleranceDays !== undefined ? Number(sap.ToleranceDays) : undefined,
        grupo_articulos: (sap.ItemsGroupCode ?? sap.ItemsGroup ?? sap.GroupCode) !== undefined ? String(sap.ItemsGroupCode ?? sap.ItemsGroup ?? sap.GroupCode) : undefined,
        tipo_bien: sap.U_TIPO_BIEN ?? undefined,
        inventoryItem: normalizeBoolToTYes(sap.InventoryItem),
        salesItem: normalizeBoolToTYes(sap.SalesItem),
        purchaseItem: normalizeBoolToTYes(sap.PurchaseItem),
        cantidad_minima_pedido: sap.MinOrderQuantity !== undefined ? Number(sap.MinOrderQuantity) : undefined
      };

      // Mapeo para buildDynamicUpdate: { keyEnSapData: columna_mysql }
      const fieldMapping = {
        descripcion_sap: 'descripcion_sap',
        nombre_extranjero: 'nombre_extranjero',
        indicadorIVAVentas: 'indicadorIVAVentas',
        indicadorIVACompras: 'indicadorIVACompras',
        lead_time: 'lead_time',
        dias_tolerancia: 'dias_tolerancia',
        grupo_articulos: 'grupo_articulos',
        tipo_bien: 'tipo_bien',
        inventoryItem: 'inventoryItem',
        salesItem: 'salesItem',
        purchaseItem: 'purchaseItem',
        cantidad_minima_pedido: 'cantidad_minima_pedido'
      };

      const { setClause, values, changedFields, hasChanges } = buildDynamicUpdate(localItem, sapData, fieldMapping);

      if (!hasChanges) {
        // No hay diferencias
        continue;
      }

      // Ejecutar update
      const sql = `UPDATE codigos SET ${setClause}, updated_at = NOW() WHERE id = ?`;
      const params = [...values, localItem.id];
      await conn.query(sql, params);

      updated++;
      console.log(`[Sync] Actualizado id=${localItem.id} codigo=${code} cambios=`, changedFields);
    }

    // cerrar sesión SAP
    await logoutFromSap(sessionId);

    return res.status(200).json({ success: true, message: 'Sincronización completada', total: localRecords.length, updated, skipped });

  } catch (error) {
    console.error('[Sync] Error general:', error.message || error);
    if (sessionId) await logoutFromSap(sessionId).catch(() => {});
    return res.status(500).json({ success: false, message: 'Error en sincronización', error: error.message || error });
  } finally {
    if (conn) conn.release();
  }
};

export { syncSapToMysql };
