import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';

// INSERTAR PARTES DEL  CÓDIGO (Solo CONTABILIDAD)
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
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = resultadoUsuario[0].rol.toLowerCase();
    if (!userRole.includes('contabilidad')) {
      return res.status(403).json({ success: false, message: 'Solo contabilidad puede realizar esta acción' });
    }

    // 2. VALIDAR EXISTENCIA DEL REGISTRO
    const queryExistencia = 'SELECT id, codigo, grupo_articulos, tipo_bien, status FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, message: 'El código no existe' });
    }

    // 3. VALIDACIÓN DE CAMPOS
    if (!grupo_articulos || !tipo_bien) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    if (grava_iva === 'SI' && (!impuesto_compra || !impuesto_venta)) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios de IVA' });
    }

    // 4. PREPARAR HISTORIAL
    const historyEntry = JSON.stringify({
      usuario: userName,
      fecha: new Date().toISOString().split('T')[0],
      accion: "Aprobado por Contabilidad"
    });

    // 5. EJECUTAR EL UPDATE (9 parámetros para SET + 1 para WHERE)
    const updateQuery = `
      UPDATE codigos 
      SET grupo_articulos = ?, 
          tipo_bien = ?, 
          impuesto_compra = ?, 
          impuesto_venta = ?, 
          grava_iva = ?,
          indicadorIVACompras = ?,
          indicadorIVAVentas = ?,
          status = ?,
          r_contabilidad = ?, 
          updated_by = ?
      WHERE id = ?
    `;

    
    await pool.query(updateQuery, [
      grupo_articulos,                                  // 1. grupo_articulos
      tipo_bien,                                        // 2. tipo_bien
      grava_iva === 'SI' ? impuesto_compra : '',       // 3. impuesto_compra
      grava_iva === 'SI' ? impuesto_venta : '',        // 4. impuesto_venta
      grava_iva || 'SI',                               // 5. grava_iva
      grava_iva === 'SI' ? impuesto_compra : '',       // 6. indicadorIVACompras
      grava_iva === 'SI' ? impuesto_venta : '',        // 7. indicadorIVAVentas
      'Con Maestro de Datos',                          // 8. status
      historyEntry,                                    // 9. r_contabilidad 
      userId,                                          // 10. updated_by 
      id                                               // 11. WHERE id = ?
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo: existe[0].codigo,
      modulo: 'contabilidad',
      accion: 'Actualización de contabilidad',
      campoAfectado: 'grupo_articulos,tipo_bien,impuesto_compra,impuesto_venta,status',
      valorAnterior: {
        grupo_articulos: existe[0].grupo_articulos,
        tipo_bien: existe[0].tipo_bien,
        impuesto_compra: existe[0].impuesto_compra,
        impuesto_venta: existe[0].impuesto_venta,
        status: existe[0].status
      },
      valorNuevo: {
        grupo_articulos,
        tipo_bien,
        impuesto_compra,
        impuesto_venta,
        status: 'Con Maestro de Datos'
      },
      usuarioId: userId,
      usuarioNombre: nombreContabilidad
    });

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

    // 3. Cambiar el estado a 'nuevo' y reescribir el comentario
    const query = 'UPDATE codigos SET status = ?, comentario = ? WHERE id = ?';
    await pool.query(query, ['RetornoCompras', comentario, id]);
    
    return res.status(200).json({ msg: 'Envio con exito a compras para revisión' });
  } catch (error) {
    console.error('Error en retornoCodigosContabilidad:', error);
    return res.status(500).json({ msg: 'Error de servidor al retornar el código desde Contabilidad' });
  }
};

export { updateContabilidadCodigo, retornoCodigosContabilidad };