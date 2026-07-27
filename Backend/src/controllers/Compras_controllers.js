import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';
import { notificarResumenPorEstado } from '../telegram/telegramService.js';
import { buildDynamicUpdate } from '../utils/dbHelpers.js';


// INSERTAR PARTES DEL  CÓDIGO (Solo COMPRAS)
const COMPRAS_FIELDS_MAPPING = {
  descripcion_sap: 'descripcion_sap',
  nombre_extranjero: 'nombre_extranjero',
  lead_time: 'lead_time',
  dias_tolerancia: 'dias_tolerancia',
  cantidad_minima_pedido: 'cantidad_minima_pedido',
  unidad_medida: 'unidad_medida',
  grava_iva: 'grava_iva'
};


  const updateComprasCodigo = async (req, res) => {
  const { id } = req.params; 
  const {
    nombreCompras,
    unidad_medida,
    lead_time,
    cantidad_minima_pedido,
    dias_tolerancia,
    descripcion_sap,
    grava_iva,
    userId,
    userName
  } = req.body;

  try {
    // 1. VALIDAR ROL (Cambiamos nombres de variables para evitar el error 500)
    const queryUsuario = 'SELECT rol FROM usuarios WHERE id = ?';
    const [resultadoUsuario] = await pool.query(queryUsuario, [userId]);
    
    if (!resultadoUsuario || resultadoUsuario.length === 0) {
      return res.status(401).json({ success: false, msg: 'Usuario no validado' });
    }

    const userRole = (resultadoUsuario[0].rol || '').toLowerCase();
    if (!userRole.includes('compras')) {
      return res.status(403).json({ success: false, msg: 'Solo compras puede realizar esta acción' });
    }

    // 2. VALIDAR EXISTENCIA DEL REGISTRO
    const queryExistencia = 'SELECT *FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, msg: 'El código no existe' });
    }

    const codigoActual = existe[0];

    // 3. VALIDACIÓN DE CAMPOS
    if (!descripcion_sap) {
      return res.status(400).json({ success: false, msg: 'Falta campo requerido: descripcion_sap' });
    }
    if (!lead_time && !dias_tolerancia && !cantidad_minima_pedido) {
      return res.status(400).json({ success: false, msg: 'Faltan campos: Lead Time, Días de Tolerancia o Cantidad Mínima de Pedido' });
    }

    const bodyAjustado = {
      ...req.body,
      nombre_extranjero: descripcion_sap,
      grava_iva: grava_iva || 'SI'
    };

    const { setClause, values, changedFields, hasChanges } = buildDynamicUpdate(codigoActual, bodyAjustado, COMPRAS_FIELDS_MAPPING);

    if (!hasChanges) {
      return res.status(200).json({ success: true, msg: 'No se realizaron cambios en el código' });
    }

    let currentHistory = [];
    try {
      currentHistory = JSON.parse(codigoActual.r_compras || '[]');
      if(!Array.isArray(currentHistory)) currentHistory = [currentHistory];
    } catch {
      currentHistory = [];
    }

    currentHistory.push({
      usuario: userName || nombreCompras,
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Aprobado/Actualizado por Compras',
      camposModificados: Object.keys(changedFields)
    });

    const finalSetClause = `${setClause}, status = ?, r_compras = ?, updated_by = ?`;
    const finalValues = [...values, 'En Contabilidad', JSON.stringify(currentHistory), userId, id];

    const updateQuery = `UPDATE codigos SET ${finalSetClause} WHERE id = ?`;
    await pool.query(updateQuery, finalValues);
    
    const valorAnteriorLimpiado = {};
    const valorNuevoLimpiado = {};

    for (const [columna, datos] of Object.entries(changedFields)) {
      valorAnteriorLimpiado[columna] = datos.anterior;
      valorNuevoLimpiado[columna] = datos.nuevo;
    }

    await registrarReporteCodigo({
      codigoId: id,
      codigo: existe[0].codigo,
      modulo: 'compras',
      accion: 'Actualización de compras',
      campoAfectado: Object.keys(changedFields).join(','),
      valorAnterior: valorAnteriorLimpiado,
      valorNuevo: valorNuevoLimpiado,
      usuarioId: userId,
      usuarioNombre: nombreCompras || userName
    });

    try {
    await notificarResumenPorEstado('En Contabilidad', descripcion_sap, 'Código actualizado por Compras');
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
      // No lanzamos el error para que la petición responda 200/201 aunque falle Telegram
    }
    

    return res.status(200).json({ 
      success: true, 
      message: 'Código actualizado exitosamente por Compras' 
    });
    
  } catch (error) {
    console.error('ERROR CRÍTICO EN EL SERVIDOR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

const retornoCodigosCompras = async (req, res) => {
  try {
    const { id, comentario } = req.body;

    // 1. Validar que vengan los datos requeridos
    if (!id || !comentario) {
      return res.status(400).json({ msg: 'El ID y el comentario son obligatorios' });
    }

    // 2. Validar la longitud máxima (200 caracteres)
    if (comentario.length > 200) {
      return res.status(400).json({ 
        msg: `El comentario es demasiado largo. Máximo 200 caracteres (actual: ${comentario.length})` 
      });
    }

    // 3. Si todo está bien, actualizamos en la base de datos
    const query = 'UPDATE codigos SET status = ?, comentario = ? WHERE id = ?';
    await pool.query(query, ['RetornoSolicitante', comentario, id]);


    try {
    await notificarResumenPorEstado('Solicitante', comentario, 'Código rechazado por Compras');
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
      // No lanzamos el error para que la petición responda 200/201 aunque falle Telegram
    }
    
    return res.status(200).json({ msg: 'Envio con exito al solicitante para revisión' });
  } catch (error) {
    console.error('Error al insertar el comentario en Compras:', error);
    return res.status(500).json({ msg: 'Error de servidor al guardar el comentario' });
  }
};


export { updateComprasCodigo, retornoCodigosCompras };
