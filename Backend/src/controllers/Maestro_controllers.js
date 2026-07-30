import pool from '../database.js';
import axios from 'axios';
import https from 'https';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';
import { notificarResumenPorEstado } from '../telegram/telegramService.js';
import { buildDynamicUpdate } from '../utils/dbHelpers.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Helper para cerrar sesión en SAP de forma segura
const closeSapSession = async (sessionId) => {
  if (!sessionId) return;
  try {
    await axios.post(
      `${process.env.SAP_URL}/Logout`,
      {},
      {
        httpsAgent,
        headers: { Cookie: `B1SESSION=${sessionId}` }
      }
    );
    console.log(`Sesión SAP cerrada correctamente: ${sessionId}`);
  } catch (error) {
    console.warn('Error al cerrar sesión en SAP:', error.response?.data || error.message);
  }
};

// OBTENER CODIGOS FINALIZADOS PARA EXPORTACION
const obtenerCodigosFinalizadosMaestro = async (req, res) => {
  const descomprimirRSap = (valor) => {
    if (!valor) return [];

    let historial = valor;
    if (typeof valor === 'string') {
      try {
        historial = JSON.parse(valor);
      } catch {
        return [valor];
      }
    }

    if (Array.isArray(historial)) {
      return historial.map((registro) => {
        if (registro && typeof registro === 'object') {
          return {
            fecha: registro.fecha || '',
            creador: registro.usuario || '',
            raw: registro,
          };
        }
        return {
          fecha: '',
          creador: String(registro),
          raw: registro,
        };
      });
    }

    if (typeof historial === 'object') {
      return [{ fecha: historial.fecha || '', creador: historial.usuario || '', raw: historial }];
    }

    return [{ fecha: '', creador: String(historial), raw: historial }];
  };

  try {
    // Usar directamente pool.query evita tener que gestionar manual el release del pool
    const [codigos] = await pool.query(
      `SELECT id, codigo, status, descripcion_sap, r_sap
       FROM codigos
       WHERE status = ?
       ORDER BY updated_at DESC, created_at DESC`,
      ['Finalizado']
    );

    const codigosFinalizados = codigos.map((codigo) => ({
      id: codigo.id,
      codigo: codigo.codigo,
      status: codigo.status,
      descripcion_sap: codigo.descripcion_sap,
      r_sap_descomprimido: descomprimirRSap(codigo.r_sap)
    }));

    return res.status(200).json({
      success: true,
      message: 'Códigos finalizados obtenidos exitosamente',
      codigos: codigosFinalizados
    });
  } catch (error) {
    console.error('Error obteniendo códigos finalizados para maestro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


// UPDATE Y ENVIO A SAP - MAESTRO DE DATOS
// UPDATE Y ENVIO A SAP - MAESTRO DE DATOS
const MAESTRODATOS_FIELD_MAP = {
  codigo: 'codigo',
  descripcion_sap: 'descripcion_sap',
  lead_time: 'lead_time',
  dias_tolerancia: 'dias_tolerancia',
  cantidad_minima_pedido: 'cantidad_minima_pedido',
  unidad_compra: 'unidad_medida',
  grupo_articulos: 'grupo_articulos',
  tipo_bien: 'tipo_bien',
  impuesto_compra: 'indicadorIVACompras',
  impuesto_venta: 'indicadorIVAVentas',
  inventario: 'inventoryItem',
  venta: 'salesItem',
  compra: 'purchaseItem'
};

const updateMaestroDatos = async (req, res) => {
  const { id } = req.params;
  const {
    nombreMaestroDatos,
    codigo,
    descripcion_sap,
    nombre_extranjero,
    unidad_compra,
    cantidad_minima_pedido,
    impuesto_compra,
    impuesto_venta,
    lead_time,
    dias_tolerancia,
    grupo_articulos,
    tipo_bien,
    inventario,
    venta,
    compra,
    userId,
    userName
  } = req.body;

  let sessionId = null;

  try {
    // 1. VALIDAR QUE EL CÓDIGO EXISTA
    const codigoQuery = 'SELECT * FROM codigos WHERE id = ?';
    const [codigoResults] = await pool.query(codigoQuery, [id]);

    if (codigoResults.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'El código no existe'
      });
    }

    // Guardamos el objeto actual obtenido de la BD en codigoActual
    const codigoActual = codigoResults[0];

    // 2. VALIDAR ROL DEL USUARIO
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);

    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, msg: 'Usuario no validado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (!userRole.includes('maestro') && !userRole.includes('admin')) {
      return res.status(403).json({
        success: false,
        msg: 'Solo el Maestro de Datos o Administrador puede realizar esta acción'
      });
    }

    // 3. VALIDACIONES DE CAMPOS REQUERIDOS
    if (!codigo || !descripcion_sap || !nombre_extranjero || !unidad_compra || !grupo_articulos || !tipo_bien || !impuesto_compra || !impuesto_venta || cantidad_minima_pedido === undefined) {
      return res.status(400).json({
        success: false,
        msg: 'Faltan campos obligatorios para el registro en SAP'
      });
    }

    // 4. INICIAR SESIÓN EN SAP
    console.log('\n1. Iniciando sesión en SAP...');
    try {
      const sapLoginResponse = await axios.post(`${process.env.SAP_URL}/Login`, {
        CompanyDB: process.env.SAP_COMPANYDB,
        UserName: process.env.SAP_USERNAME,
        Password: process.env.SAP_PASSWORD
      }, { httpsAgent });

      sessionId = sapLoginResponse.data.SessionId;
      console.log(`Sesión SAP iniciada: ${sessionId}`);
    } catch (error) {
      console.error('Error al iniciar sesión SAP:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión en SAP',
        error: error.response?.data || error.message
      });
    }

    // 5. VALIDAR IMPUESTOS (VATs)
    const purchaseVAT = (impuesto_compra || '').trim();
    const salesVAT = (impuesto_venta || '').trim();

    const vatResp = await axios.get(
      `${process.env.SAP_URL}/SalesTaxAuthorities?$select=Code`,
      {
        httpsAgent,
        headers: { Cookie: `B1SESSION=${sessionId}` }
      }
    );

    const availableCodes = (vatResp.data.value || []).map(v => String(v.Code).trim());
    const missingVATs = [];
    if (purchaseVAT && !availableCodes.includes(purchaseVAT)) missingVATs.push(purchaseVAT);
    if (salesVAT && !availableCodes.includes(salesVAT)) missingVATs.push(salesVAT);

    if (missingVATs.length) {
      await closeSapSession(sessionId);
      return res.status(400).json({
        success: false,
        msg: `VATs no válidos en SAP: ${missingVATs.join(', ')}`,
        missing: missingVATs
      });
    }

    // 6. VALIDAR DUPLICADO EN SAP
    try {
      await axios.get(
        `${process.env.SAP_URL}/Items('${encodeURIComponent(codigo)}')`,
        {
          httpsAgent,
          headers: { Cookie: `B1SESSION=${sessionId}` }
        }
      );

      // Si no lanza error 404, significa que el ítem YA EXISTE
      await closeSapSession(sessionId);
      return res.status(409).json({
        success: false,
        msg: 'El código ya existe en SAP',
        duplicateInSap: true,
        codigo
      });

      console.log(`Código ${codigo} ya existe en SAP, no se puede crear duplicado.`);
      
    } catch (error) {
      const statusCode = error.response?.status;
      if (statusCode && statusCode !== 404) {
        await closeSapSession(sessionId);
        return res.status(statusCode).json({
          success: false,
          msg: 'Error al validar duplicado en SAP',
          error: error.response?.data || error.message
        });
      }
    }

    // 7. PREPARAR PAYLOAD DE ITEM
    const isInventory = inventario === 'tYES';
    const isSales = venta === 'tYES';
    const isPurchase = compra === 'tYES';

    const sapItemPayload = {
      IndirectTax: 'tYES',
      ItemCode: codigo,
      ItemName: descripcion_sap,
      ForeignName: nombre_extranjero,
      ArTaxCode: salesVAT,      // ArTaxCode es para Ventas
      ApTaxCode: purchaseVAT,   // ApTaxCode es para Compras
      LeadTime: parseInt(lead_time) || 0,
      ItemsGroupCode: parseInt(grupo_articulos) || 0,
      U_TIPO_BIEN: tipo_bien,
      InventoryItem: isInventory ? 'tYES' : 'tNO',
      SalesItem: isSales ? 'tYES' : 'tNO',
      PurchaseItem: isPurchase ? 'tYES' : 'tNO',
      ToleranceDays: parseInt(dias_tolerancia) || 0,
      MinOrderQuantity: parseFloat(cantidad_minima_pedido) || 0
    };

    if (isInventory) {
      sapItemPayload.InventoryUOM = unidad_compra;
      sapItemPayload.ManageBatchNumbers = 'tYES';
    } else {
      sapItemPayload.ManageBatchNumbers = 'tNO';
    }

    if (isSales) sapItemPayload.SalesUnit = unidad_compra;
    if (isPurchase) sapItemPayload.PurchaseUnit = unidad_compra;

    // 8. CREAR ITEM EN SAP
    console.log('\n2. Enviando item a SAP...');
    const sapItemResponse = await axios.post(`${process.env.SAP_URL}/Items`, sapItemPayload, {
      httpsAgent,
      headers: { Cookie: `B1SESSION=${sessionId}` }
    });

    // Logout inmediato tras operación exitosa en SAP
    await closeSapSession(sessionId);
    sessionId = null;

    // 9. ACTUALIZAR BASE DE DATOS LOCAL
    console.log('\n3. Actualizando base de datos local...');

    // Normalizamos tipos numéricos requeridos para la base de datos
    const bodyAjustado = {
      ...req.body,
      lead_time: parseInt(lead_time) || 0,
      dias_tolerancia: parseInt(dias_tolerancia) || 0,
      cantidad_minima_pedido: parseFloat(cantidad_minima_pedido) || 0
    };

    const { setClause, values, changedFields } = buildDynamicUpdate(
      codigoActual, // Usamos codigoActual en lugar del registro previo
      bodyAjustado,
      MAESTRODATOS_FIELD_MAP
    );

    // Preparar historial acumulativo
    let currentHistory = [];
    try {
      currentHistory = JSON.parse(codigoActual.r_maestrodatos || '[]');
      if (!Array.isArray(currentHistory)) currentHistory = [currentHistory];
    } catch {
      currentHistory = [];
    }

    currentHistory.push({
      usuario: userName || nombreMaestroDatos,
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Sincronizado con SAP y Finalizado'
    });

    // Si setClause está vacío (raro pero posible), preparamos la consulta base
    const baseSetClause = setClause ? `${setClause}, ` : '';
    const finalSetClause = `${baseSetClause}status = ?, r_maestrodatos = ?, r_sap = ?, updated_by = ?`;
    
    const finalValues = [
      ...values,
      'Finalizado',
      JSON.stringify(currentHistory),
      JSON.stringify(sapItemResponse.data),
      userId,
      id
    ];

    const updateQuery = `UPDATE codigos SET ${finalSetClause} WHERE id = ?`;
    await pool.query(updateQuery, finalValues);

    // 10. AUDITORÍA / LOGS DE CAMBIOS
    const valorAnteriorLimpiado = {};
    const valorNuevoLimpiado = {};

    for (const [columna, datos] of Object.entries(changedFields)) {
      valorAnteriorLimpiado[columna] = datos.anterior;
      valorNuevoLimpiado[columna] = datos.nuevo;
    }

    await registrarReporteCodigo({
      codigoId: id,
      codigo,
      modulo: 'maestrodatos',
      accion: 'Sincronización con SAP y actualización maestro de datos',
      campoAfectado: Object.keys(changedFields).join(','),
      valorAnterior: valorAnteriorLimpiado,
      valorNuevo: valorNuevoLimpiado,
      usuarioId: userId,
      usuarioNombre: nombreMaestroDatos || userName
    });

    // 11. NOTIFICACIÓN TELEGRAM
    try {
      await notificarResumenPorEstado('Finalizado', descripcion_sap, 'Código sincronizado con SAP por Maestro de Datos', codigo);
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
    }

    return res.status(200).json({
      success: true,
      message: 'Item procesado y creado exitosamente en SAP',
      data: {
        codigoId: id,
        sapItemCode: sapItemResponse.data.ItemCode,
        status: 'Finalizado',
        sapResponse: sapItemResponse.data,
        camposModificados: Object.keys(changedFields)
      }
    });

  } catch (error) {
    if (sessionId) await closeSapSession(sessionId);

    console.error('\nERROR CRÍTICO EN MAESTRO DE DATOS:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el código en Maestro de Datos',
      error: error.response?.data || error.message
    });
  }
};

// DEVOLVER CÓDIGO A REVISIÓN
const retornoCodigosMaestroDatos = async (req, res) => {
  try {
    const { id, comentario, userId } = req.body;

    if (!id || !comentario) {
      return res.status(400).json({ success: false, msg: 'El ID y el comentario son obligatorios' });
    }

    if (comentario.length > 200) {
      return res.status(400).json({
        success: false,
        msg: `El comentario no puede superar los 200 caracteres (actual: ${comentario.length})`
      });
    }

    const [userResults] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [userId]);

    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (!userRole.includes('maestro') && !userRole.includes('admin')) {
      return res.status(403).json({
        success: false,
        msg: 'Solo el Maestro de Datos puede realizar esta acción'
      });
    }

    const query = 'UPDATE codigos SET status = ?, comentario = ? WHERE id = ?';
    await pool.query(query, ['RetornoSolicitante', comentario, id]);
    try {
      await notificarResumenPorEstado('RetornoSolicitante', comentario, 'Código devuelto por Maestro de Datos');
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
      // No lanzamos el error para que la petición responda 200/201 aunque falle Telegram
    }

    return res.status(200).json({ success: true, msg: 'Código devuelto exitosamente al solicitante para revisión' });
  } catch (error) {
    console.error('Error en retornoCodigosMaestroDatos:', error);
    return res.status(500).json({ success: false, msg: 'Error interno del servidor al retornar el código' });
  }
};

// ACTUALIZACIÓN EXCLUSIVA PARA INPEL - MAESTRO DE DATOS
const updateMaestroDatosLocal = async (req, res) => {
  const { id } = req.params;
  const {
    nombreMaestroDatos,
    codigo,
    descripcion_sap,
    nombre_extranjero,
    unidad_compra,
    cantidad_minima_pedido,
    impuesto_compra,
    impuesto_venta,
    lead_time,
    dias_tolerancia,
    grupo_articulos,
    tipo_bien,
    inventario,
    venta,
    compra,
    userId,
    userName
  } = req.body;

  try {
    // 1. VALIDAR QUE EL CÓDIGO EXISTA EN BD
    const codigoQuery = 'SELECT * FROM codigos WHERE id = ?';
    const [codigoResults] = await pool.query(codigoQuery, [id]);

    if (codigoResults.length === 0) {
      return res.status(404).json({
        success: false,
        msg: 'El código no existe'
      });
    }

    const codigoActual = codigoResults[0]; // Usado para historial y validaciones previas

    // 2. VALIDAR ROL DEL USUARIO
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);

    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, msg: 'Usuario no validado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (!userRole.includes('maestro') && !userRole.includes('admin')) {
      return res.status(403).json({
        success: false,
        msg: 'Solo el Maestro de Datos o Administrador puede realizar esta acción'
      });
    }

    // 3. VALIDACIONES DE CAMPOS REQUERIDOS
    if (!codigo || !descripcion_sap || !nombre_extranjero || !unidad_compra || !grupo_articulos || !tipo_bien || !impuesto_compra || !impuesto_venta || cantidad_minima_pedido === undefined) {
      return res.status(400).json({
        success: false,
        msg: 'Faltan campos obligatorios para la actualización local'
      });
    }

    // 4. ACTUALIZAR BASE DE DATOS LOCAL
    console.log('\nActualizando base de datos local (Sin SAP)...');

    // Normalizamos tipos numéricos requeridos para la base de datos
    const bodyAjustado = {
      ...req.body,
      lead_time: parseInt(lead_time) || 0,
      dias_tolerancia: parseInt(dias_tolerancia) || 0,
      cantidad_minima_pedido: parseFloat(cantidad_minima_pedido) || 0
    };

    const { setClause, values, changedFields } = buildDynamicUpdate(
      codigoActual, // Usamos la fila de la BD obtenida en el paso 1
      bodyAjustado,
      MAESTRODATOS_FIELD_MAP
    );

    // Preparar historial acumulativo
    let currentHistory = [];
    try {
      currentHistory = JSON.parse(codigoActual.r_maestrodatos || '[]');
      if (!Array.isArray(currentHistory)) currentHistory = [currentHistory];
    } catch {
      currentHistory = [];
    }

    currentHistory.push({
      usuario: userName || nombreMaestroDatos,
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Actualización Local (Maestro de Datos)'
    });

    // Eliminamos r_sap = ? ya que no hay respuesta de SAP
    const baseSetClause = setClause ? `${setClause}, ` : '';
    const finalSetClause = `${baseSetClause}status = ?, r_maestrodatos = ?, updated_by = ?`;
    
    // Cambiamos el estado, puedes ajustarlo si necesitas que siga siendo "Finalizado"
    const estadoNuevo = 'Actualizado Local'; 

    const finalValues = [
      ...values,
      estadoNuevo,
      JSON.stringify(currentHistory),
      userId,
      id
    ];

    const updateQuery = `UPDATE codigos SET ${finalSetClause} WHERE id = ?`;
    await pool.query(updateQuery, finalValues);

    // 5. AUDITORÍA / LOGS DE CAMBIOS
    const valorAnteriorLimpiado = {};
    const valorNuevoLimpiado = {};

    for (const [columna, datos] of Object.entries(changedFields)) {
      valorAnteriorLimpiado[columna] = datos.anterior;
      valorNuevoLimpiado[columna] = datos.nuevo;
    }

    await registrarReporteCodigo({
      codigoId: id,
      codigo,
      modulo: 'maestrodatos',
      accion: 'Actualización local maestro de datos',
      campoAfectado: Object.keys(changedFields).join(','),
      valorAnterior: valorAnteriorLimpiado,
      valorNuevo: valorNuevoLimpiado,
      usuarioId: userId,
      usuarioNombre: nombreMaestroDatos || userName
    });

    // 6. NOTIFICACIÓN TELEGRAM
    try {
      await notificarResumenPorEstado(estadoNuevo, descripcion_sap, 'Código actualizado localmente por Maestro de Datos', codigo);
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
    }

    return res.status(200).json({
      success: true,
      message: 'Item actualizado exitosamente en la base de datos local',
      data: {
        codigoId: id,
        status: estadoNuevo,
        camposModificados: Object.keys(changedFields)
      }
    });

  } catch (error) {
    console.error('\nERROR EN ACTUALIZACIÓN LOCAL MAESTRO DE DATOS:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la actualización local del código',
      error: error.message
    });
  }
};



export { updateMaestroDatos, obtenerCodigosFinalizadosMaestro, retornoCodigosMaestroDatos };