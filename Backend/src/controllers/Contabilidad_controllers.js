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
    userId,
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

    // 4. PREPARAR HISTORIAL
    const historyEntry = JSON.stringify({
      usuario: userName,
      fecha: new Date().toISOString().split('T')[0],
      accion: "Aprobado por Contabilidad"
    });

    // 5. EJECUTAR EL UPDATE (6 parámetros para SET + 1 para WHERE)
    const updateQuery = `
      UPDATE codigos 
      SET grupo_articulos = ?, 
          tipo_bien = ?, 
          status = ?,
          r_contabilidad = ?, 
          updated_by = ?
      WHERE id = ?
    `;

    
    await pool.query(updateQuery, [
      grupo_articulos,                  // 1. grupo_articulos
      tipo_bien,                        // 2. tipo_bien
      'Con Maestro de Datos',           // 3. status
      historyEntry,                     // 4. r_contabilidad 
      userId,                           // 5. updated_by 
      id                                // 6. WHERE id = ?
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo: existe[0].codigo,
      modulo: 'contabilidad',
      accion: 'Actualización de contabilidad',
      campoAfectado: 'grupo_articulos,tipo_bien,status',
      valorAnterior: {
        grupo_articulos: existe[0].grupo_articulos,
        tipo_bien: existe[0].tipo_bien,
        status: existe[0].status
      },
      valorNuevo: {
        grupo_articulos,
        tipo_bien,
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

export { updateContabilidadCodigo };