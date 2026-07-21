import pool from '../database.js';
import axios from 'axios';
import https from 'https';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// OBTENER CODIGOS FINALIZADOS PARA EXPORTACION
const obtenerCodigosFinalizadosMaestro = async (req, res) => {
  const connection = await pool.getConnection();

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
          const fecha =  registro.fecha  || '';
          const creador = registro.usuario  || '';

          console.log('Registro descomprimido:', fecha, creador);

          return {
            fecha,
            creador,
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
      const fecha = historial.fecha  || '';
      const creador = historial.usuario  || '';

      return [{ fecha, creador, raw: historial }];
    }

    return [{ fecha: '', creador: String(historial), raw: historial }];
  };

  try {
    const [codigos] = await connection.query(
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
  } finally {
    connection.release();
  }
};


// UPDATE Y ENVIO A SAP - MAESTRO DE DATOS
const updateMaestroDatos = async (req, res) => {
  const { id } = req.params;
  const {
    nombreMaestroDatos,
    codigo,
    descripcion,
    detalles,
    link_referencia,
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

  console.log(req.body);

  try {
    // 1. VALIDAR QUE EL CÓDIGO EXISTA
    const codigoQuery = 'SELECT id, codigo, descripcion, detalles, link_referencia, descripcion_sap, lead_time, dias_tolerancia, cantidad_minima_pedido, grupo_articulos, tipo_bien, indicadorIVACompras, indicadorIVAVentas, inventoryItem, salesItem, purchaseItem, status FROM codigos WHERE id = ?';
    const [codigoResults] = await pool.query(codigoQuery, [id]);
    
    if (codigoResults.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'El código no existe' 
      });
    }

    // 2. VALIDAR ROL DEL USUARIO (Maestro de Datos)
    console.log(userId);
    
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);
    
    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = userResults[0].rol.toLowerCase();
    if (!userRole.includes('maestro') && !userRole.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        msg: 'Solo maestro de datos puede realizar esta acción' 
      });
    }

    // 3. VALIDACIONES DE CAMPOS REQUERIDOS
    if (!codigo || !descripcion_sap || !nombre_extranjero || !unidad_compra || !grupo_articulos || !tipo_bien || !impuesto_compra || !impuesto_venta || !cantidad_minima_pedido) {
      return res.status(400).json({
        success: false,
        msg: 'Faltan campos obligatorios: codigo, descripcion_sap, nombre_extranjero, unidad_compra, grupo_articulos, tipo_bien, impuesto_compra, impuesto_venta, cantidad_minima_pedido'
      });
    }

    // 4. INICIAR SESIÓN EN SAP
    console.log('\n1. Iniciando sesión en SAP...');
    
    let sapLoginResponse;
    try {
      sapLoginResponse = await axios.post(`${process.env.SAP_URL}/Login`, {
        CompanyDB: process.env.SAP_COMPANYDB,
        UserName: process.env.SAP_USERNAME,
        Password: process.env.SAP_PASSWORD
      }, { 
        httpsAgent: httpsAgent
      });
    } catch (error) {
      console.error('Error al iniciar sesión SAP:', error.response?.data || error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión en SAP',
        error: error.response?.data || error.message
      });
    }

    const sessionId = sapLoginResponse.data.SessionId;
    console.log(`Sesión SAP iniciada: ${sessionId}`);

    const purchaseVAT = (impuesto_compra || '').trim();
    const salesVAT = (impuesto_venta || '').trim();

    console.log('VATs a enviar a SAP:', { purchaseVAT, salesVAT });

    const vatResp = await axios.get(
      `${process.env.SAP_URL}/SalesTaxAuthorities?$select=Code`,
      {
        httpsAgent: httpsAgent,
        headers: { 'Cookie': `B1SESSION=${sessionId}` }
      }
    );

    const availableCodes = (vatResp.data.value || []).map(v => String(v.Code).trim());

    const missingVATs = [];
    if (purchaseVAT && !availableCodes.includes(purchaseVAT)) missingVATs.push(purchaseVAT);
    if (salesVAT && !availableCodes.includes(salesVAT)) missingVATs.push(salesVAT);

    if (missingVATs.length) {
      await axios.post(`${process.env.SAP_URL}/Logout`, {}, {
        httpsAgent: httpsAgent,
        headers: { 'Cookie': `B1SESSION=${sessionId}` }
      }).catch(() => {});

      return res.status(400).json({
        success: false,
        message: `VATs no válidos en SAP: ${missingVATs.join(', ')}`,
        missing: missingVATs
      });
    }

    // 4.5 VALIDAR DUPLICADO EN SAP ANTES DE CREAR EL ITEM
    try {
      await axios.get(
        `${process.env.SAP_URL}/Items('${encodeURIComponent(codigo)}')`,
        {
          httpsAgent: httpsAgent,
          headers: { 'Cookie': `B1SESSION=${sessionId}` }
        }
      );

      await axios.post(`${process.env.SAP_URL}/Logout`, {}, {
        httpsAgent: httpsAgent,
        headers: { 'Cookie': `B1SESSION=${sessionId}` }
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        message: 'El código ya existe en SAP',
        duplicateInSap: true,
        codigo
      });
    } catch (error) {
      const statusCode = error.response?.status;

      if (statusCode && statusCode !== 404) {
        await axios.post(`${process.env.SAP_URL}/Logout`, {}, {
          httpsAgent: httpsAgent,
          headers: { 'Cookie': `B1SESSION=${sessionId}` }
        }).catch(() => {});

        return res.status(statusCode).json({
          success: false,
          message: 'Error al validar el código en SAP',
          error: error.response?.data || error.message
        });
      }
    }

    // ==========================================
    // 5. DINÁMICA DE CAMPOS DE UNIDAD Y LOTES (SAP)
    // ==========================================
    const isInventory = inventario === 'tYES';
    const isSales = venta === 'tYES';
    const isPurchase = compra === 'tYES';

    const sapItemPayload = {
      IndirectTax: 'tYES',
      ItemCode: codigo,
      ItemName: descripcion_sap,
      ForeignName: nombre_extranjero,
      ArTaxCode: purchaseVAT,
      ApTaxCode: salesVAT,
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

    if (isSales) {
      sapItemPayload.SalesUnit = unidad_compra;
    }

    if (isPurchase) {
      sapItemPayload.PurchaseUnit = unidad_compra;
    }

    // ENVIAR ITEM A SAP
    console.log('\n2. Enviando item a SAP con payload dinámico...');
    
    let sapItemResponse;
    try {
      sapItemResponse = await axios.post(`${process.env.SAP_URL}/Items`, sapItemPayload, { 
        httpsAgent: httpsAgent,
        headers: {
          'Cookie': `B1SESSION=${sessionId}`
        }
      });
    } catch (error) {
      console.error('Error al crear item en SAP:', error.response?.data || error.message);
      
      // Cerrar sesión antes de retornar error
      await axios.post(`${process.env.SAP_URL}/Logout`, {}, { 
        httpsAgent: httpsAgent,
        headers: { 'Cookie': `B1SESSION=${sessionId}` }
      }).catch(err => console.warn('Error cerrando sesión:', err.message));
      
      return res.status(500).json({
        success: false,
        message: 'Error al enviar item a SAP',
        error: error.response?.data || error.message
      });
    }

    // 6. CERRAR SESIÓN EN SAP
    console.log('\n3. Cerrando sesión en SAP...');
    try {
      await axios.post(`${process.env.SAP_URL}/Logout`, {}, { 
        httpsAgent: httpsAgent,
        headers: { 'Cookie': `B1SESSION=${sessionId}` }
      });
      console.log(`Sesión SAP cerrada: ${sessionId}`);
    } catch (error) {
      console.warn('Error al cerrar sesión SAP:', error.response?.data || error.message);
    }

    // 7. ACTUALIZAR BASE DE DATOS LOCAL
    console.log('\n4. Actualizando base de datos local...');
    
    const historyEntry = JSON.stringify([{
      usuario: userName,
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Sincronizado con SAP'
    }]);

    const updateQuery = `
      UPDATE codigos 
      SET 
        codigo = ?,
        descripcion = ?,
        detalles = ?,
        link_referencia = ?,
        descripcion_sap = ?,
        lead_time = ?,
        dias_tolerancia = ?,
        unidad_medida = ?,
        grupo_articulos = ?,
        tipo_bien = ?,
        indicadorIVACompras = ?,
        indicadorIVAVentas = ?,
        inventoryItem = ?,
        salesItem = ?,
        purchaseItem = ?,
        status = ?,
        r_maestrodatos = ?,
        r_sap = ?,
        updated_by = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      codigo,
      descripcion,
      detalles,
      link_referencia,
      descripcion_sap,
      lead_time,
      dias_tolerancia,
      unidad_compra,
      grupo_articulos,
      tipo_bien,
      impuesto_compra,
      impuesto_venta,
      inventario,
      venta,
      compra,
      'Finalizado',
      historyEntry,
      JSON.stringify(sapItemResponse.data),
      userId,
      id
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo,
      modulo: 'maestrodatos',
      accion: 'Sincronización con SAP y actualización maestro de datos',
      campoAfectado: 'codigo,descripcion,detalles,link_referencia,descripcion_sap,lead_time,dias_tolerancia,cantidad_minima_pedido,grupo_articulos,tipo_bien,indicadorIVACompras,indicadorIVAVentas,inventoryItem,salesItem,purchaseItem,status,unidad_medida',
      valorAnterior: {
        codigo: codigoResults[0].codigo,
        descripcion: codigoResults[0].descripcion,
        detalles: codigoResults[0].detalles,
        link_referencia: codigoResults[0].link_referencia,
        descripcion_sap: codigoResults[0].descripcion_sap,
        lead_time: codigoResults[0].lead_time,
        dias_tolerancia: codigoResults[0].dias_tolerancia,
        cantidad_minima_pedido: codigoResults[0].cantidad_minima_pedido,
        grupo_articulos: codigoResults[0].grupo_articulos,
        tipo_bien: codigoResults[0].tipo_bien,
        indicadorIVACompras: codigoResults[0].indicadorIVACompras,
        indicadorIVAVentas: codigoResults[0].indicadorIVAVentas,
        inventoryItem: codigoResults[0].inventoryItem,
        salesItem: codigoResults[0].salesItem,
        purchaseItem: codigoResults[0].purchaseItem,
        status: codigoResults[0].status,
        unidad_medida: codigoResults[0].unidad_medida
      },
      valorNuevo: {
        codigo,
        descripcion,
        detalles,
        link_referencia,
        descripcion_sap,
        lead_time,
        dias_tolerancia,
        cantidad_minima_pedido,
        grupo_articulos,
        tipo_bien,
        indicadorIVACompras: impuesto_compra,
        indicadorIVAVentas: impuesto_venta,
        inventoryItem: inventario,
        salesItem: venta,
        purchaseItem: compra,
        status: 'Finalizado',
        sapResponse: sapItemResponse.data,
        unidad_medida: unidad_compra
      },
      usuarioId: userId,
      usuarioNombre: nombreMaestroDatos
    });

    console.log(`Base de datos local actualizada - Código ID: ${id}`);

    // 8. RESPUESTA EXITOSA
    console.log('\nPROCESO COMPLETADO EXITOSAMENTE\n');
    
    return res.status(200).json({
      success: true,
      message: 'Item procesado exitosamente: SAP Login -> Item Creado -> SAP Logout -> BD Actualizada',
      data: {
        codigoId: id,
        sapItemCode: sapItemResponse.data.ItemCode,
        status: 'Con Maestro de Datos',
        sapResponse: sapItemResponse.data,
      }
    });

  } catch (error) {
    console.error('\nERROR CRÍTICO EN MAESTRO DE DATOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};


const retornoCodigosMaestroDatos = async (req, res) => {
  try {
    const { id, comentario, userId } = req.body;

    const updateQuery = 'Select * from usuarios where id = ?';
    const [userResults] = await pool.query(updateQuery, [userId]);

    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = userResults[0].rol;
    if (userRole != 'maestro de datos') {
      return res.status(403).json({
        success: false,
        msg: 'Solo maestro de datos puede realizar esta acción'
      });
    }
    

    if (!id || !comentario) {
      return res.status(400).json({ msg: 'El ID y el comentario son obligatorios' });
    }

    if (comentario.length > 200) {
      return res.status(400).json({ 
        msg: `El comentario no puede superar los 200 caracteres (actual: ${comentario.length})` 
      });
    }

  
    const query = 'UPDATE codigos SET status = ?, comentario = ? WHERE id = ?';
    await pool.query(query, ['RetornoSolicitante', comentario, id]);
    
    return res.status(200).json({ msg: 'Envio con exito a compras para revisión' });
  } catch (error) {
    console.error('Error en retornoCodigosContabilidad:', error);
    return res.status(500).json({ msg: 'Error de servidor al retornar el código desde Contabilidad' });
  }
};




export { updateMaestroDatos, obtenerCodigosFinalizadosMaestro };