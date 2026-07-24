import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';
import { notificarResumenPorEstado } from '../telegram/telegramService.js';


// INSERTAR PARTES DEL  CÓDIGO (Solo COMPRAS)
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
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = resultadoUsuario[0].rol.toLowerCase();
    if (!userRole.includes('compras')) {
      return res.status(403).json({ success: false, message: 'Solo compras puede realizar esta acción' });
    }

    // 2. VALIDAR EXISTENCIA DEL REGISTRO
    const queryExistencia = 'SELECT id, codigo, lead_time, dias_tolerancia, cantidad_minima_pedido, status FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, message: 'El código no existe' });
    }

    // 3. VALIDACIÓN DE CAMPOS
    // ahora se requiere `descripcion_sap` además de al menos uno de los números
    if (!descripcion_sap) {
      return res.status(400).json({ success: false, message: 'Falta campo requerido: descripcion_sap' });
    }
    if (!lead_time && !dias_tolerancia && !cantidad_minima_pedido) {
      return res.status(400).json({ success: false, message: 'Faltan campos: Lead Time, Días de Tolerancia o Cantidad Mínima de Pedido' });
    }

    // 4. PREPARAR HISTORIAL
    const historyEntry = JSON.stringify({
      usuario: userName,
      fecha: new Date().toISOString().split('T')[0]
    });

    // 5. EJECUTAR EL UPDATE
    const updateQuery = `
      UPDATE codigos 
      SET  
          descripcion_sap = ?,
          lead_time = ?, 
          dias_tolerancia = ?, 
          cantidad_minima_pedido = ?,
          nombre_extranjero = ?,
          unidad_medida = ?,
          grava_iva = ?,
          status = ?,
          r_compras = ?, 
          updated_by = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      descripcion_sap,               // 1. descripcion_sap
      lead_time,                     // 2. lead_time
      dias_tolerancia,               // 3. dias_tolerancia
      cantidad_minima_pedido,        // 4. cantidad_minima_pedido
      descripcion_sap,               // 5. nombre_extranjero (usamos descripcion_sap como nombre_extranjero)
      unidad_medida,                 // 6. unidad_medida
      grava_iva || 'SI',             // 7. grava_iva
      'En Contabilidad',             // 8. status
      historyEntry,                  // 9. r_compras
      userId,                        // 10. updated_by
      id                             // 11. WHERE id = ?
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo: existe[0].codigo,
      modulo: 'compras',
      accion: 'Actualización de compras',
      campoAfectado: 'descripcion_sap,lead_time,dias_tolerancia,cantidad_minima_pedido,status,unidad_medida,nombre_extranjero',
      valorAnterior: {
        descripcion_sap: existe[0].descripcion_sap,
        lead_time: existe[0].lead_time,
        dias_tolerancia: existe[0].dias_tolerancia,
        cantidad_minima_pedido: existe[0].cantidad_minima_pedido,
        status: existe[0].status,
        unidad_medida: existe[0].unidad_medida,
        nombre_extranjero: existe[0].nombre_extranjero
      },
      valorNuevo: {
        descripcion_sap,
        lead_time,
        dias_tolerancia,
        cantidad_minima_pedido,
        status: 'En Contabilidad',
        unidad_medida,
        nombre_extranjero: descripcion_sap
      },
      usuarioId: userId,
      usuarioNombre: nombreCompras
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
