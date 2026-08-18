import pool from '../database.js';
import { buildDynamicUpdate } from '../utils/dbHelpers.js';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';
import { notificarResumenPorEstado } from '../telegram/telegramService.js';

// INSERTAR PARTES DEL  CÓDIGO (Solo CONTABILIDAD)

const CONTABILIDAD_FIELDS_MAPPING = {
  grupo_articulos: 'grupo_articulos',
  tipo_bien: 'tipo_bien',
  grava_iva: 'grava_iva',
  impuesto_compra: 'indicadorIVACompras',
  impuesto_venta: 'indicadorIVAVentas'
};


const updateContabilidadCodigo = async (req, res) => {
  const { id } = req.params; 
  const {
    nombreContabilidad,
    grupo_articulos, 
    tipo_bien, 
    grava_iva,
    userId,
    impuesto_compra,
    impuesto_venta,
    userName
  } = req.body;

  try {
    // 1. VALIDAR ROL
    const queryUsuario = 'SELECT rol FROM usuarios WHERE id = ?';
    const [resultadoUsuario] = await pool.query(queryUsuario, [userId]);
    
    if (!resultadoUsuario || resultadoUsuario.length === 0) {
      return res.status(401).json({ success: false, msg: 'Usuario no validado' });
    }

    const userRole = resultadoUsuario[0].rol.toLowerCase();
    if (!userRole.includes('contabilidad')) {
      return res.status(403).json({ success: false, msg: 'Solo contabilidad puede realizar esta acción' });
    }

    // 2. VALIDAR EXISTENCIA DEL REGISTRO
    const queryExistencia = 'SELECT * FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, msg: 'El código no existe' });
    }

    const codigoActual = existe[0];

    // 3. VALIDACIÓN DE CAMPOS
    if (!grupo_articulos || !tipo_bien) {
      return res.status(400).json({ success: false, msg: 'Faltan campos obligatorios' });
    }

    if (grava_iva === 'SI' && (!impuesto_compra || !impuesto_venta)) {
      return res.status(400).json({ success: false, msg: 'Faltan campos obligatorios de IVA' });
    }

    const bodyAjustado = {
      ...req.body,
      impuesto_compra: grava_iva === 'SI' ? impuesto_compra : null,
      impuesto_venta: grava_iva === 'SI' ? impuesto_venta : null
    };

    const { setClause, values, changedFields, hasChanges } = buildDynamicUpdate(codigoActual, bodyAjustado, CONTABILIDAD_FIELDS_MAPPING);

    if (!hasChanges) {
      return res.status(200).json({ success: true, msg: 'No se realizaron cambios en el código' });
    }
    let currentHistory = [];
    try {
      currentHistory = JSON.parse(codigoActual.r_contabilidad || '[]');
      if (!Array.isArray(currentHistory)) currentHistory = [currentHistory];
    } catch {
      currentHistory = [];
    }

    currentHistory.push({
      usuario: userName ||nombreContabilidad || 'Contabilidad',
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Aprobado/Actualizado por Contabilidad',
      camposModificados: Object.keys(changedFields)
    });

    const finalSetClause = `${setClause}, status = ?, r_contabilidad = ?, updated_by = ?`;
    const finalValues = [...values, 'Con Maestro de Datos', JSON.stringify(currentHistory), userId, id];

    const queryUpdate = `UPDATE codigos SET ${finalSetClause} WHERE id = ?`;
    await pool.query(queryUpdate, finalValues);

    const valorAnteriorLimpio = {};
    const valorNuevoLimpio = {};

    for (const [columna, datos] of Object.entries(changedFields)) {
      valorAnteriorLimpio[columna] = datos.anterior;
      valorNuevoLimpio[columna] = datos.nuevo;
    }

    await registrarReporteCodigo({
      codigoId: id,
      codigo: codigoActual.codigo,
      modulo: 'contabilidad',
      accion: 'Aprobado/Actualizado por Contabilidad',
      campoAfectado: Object.keys(changedFields).join(','),
      valorAnterior: valorAnteriorLimpio,
      valorNuevo: valorNuevoLimpio,
      usuarioId: userId,
      usuarioNombre: userName || nombreContabilidad
    });
    try {
      await notificarResumenPorEstado(
        'Con Maestro de Datos', 
        `${codigoActual.descripcion_sap}`, 
        'Código actualizado por Contabilidad'
      );
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Código actualizado exitosamente por Contabilidad' 
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

const retornoCodigosContabilidad = async (req, res) => {
  try {
    const { id, comentario } = req.body;

    // 1. Validar que vengan los datos requeridos
    if (!id || !comentario) {
      return res.status(400).json({ msg: 'El ID y el comentario son obligatorios' });
    }

    // 2. Validar la longitud máxima del comentario (200 caracteres)
    if (comentario.length > 200) {
      return res.status(400).json({ 
        msg: `El comentario no puede superar los 200 caracteres (actual: ${comentario.length})` 
      });
    }
  
    const [codigoActual] = await pool.query(
      'SELECT codigo, nombre_solicitante, empresa FROM codigos WHERE id = ?',
      [id]
    );

    const query = 'UPDATE codigos SET status = ?, comentario = ? WHERE id = ?';
    await pool.query(query, ['RetornoCompras', comentario, id]);
    try{
      const infoCodigo = codigoActual?.[0] || {};
      await notificarResumenPorEstado(
        'Nuevo',
        comentario,
        'Código rechazado por Contabilidad',
        infoCodigo.codigo || '',
        infoCodigo.nombre_solicitante || '',
        infoCodigo.empresa || ''
      );
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
    }
    return res.status(200).json({ msg: 'Envio con exito a compras para revisión' });
  } catch (error) {
    console.error('Error en retornoCodigosContabilidad:', error);
    return res.status(500).json({ msg: 'Error de servidor al retornar el código desde Contabilidad' });
  }
};

export { updateContabilidadCodigo, retornoCodigosContabilidad };