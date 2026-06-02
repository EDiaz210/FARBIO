import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';


// INSERTAR PARTES DEL  CÓDIGO (Solo COMPRAS)
    const updateComprasCodigo = async (req, res) => {
  const { id } = req.params; 
  const {  
    lead_time, 
    dias_tolerancia,
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
    const queryExistencia = 'SELECT id, codigo, lead_time, dias_tolerancia, status FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, message: 'El código no existe' });
    }

    // 3. VALIDACIÓN DE CAMPOS (al menos uno debe estar presente)
    if (!lead_time && !dias_tolerancia) {
      return res.status(400).json({ success: false, message: 'Faltan campos: lead_time o dias_tolerancia' });
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
          lead_time = ?, 
          dias_tolerancia = ?, 
          status = ?,
          r_compras = ?, 
          updated_by = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      lead_time,                     // 1. lead_time
      dias_tolerancia,               // 2. dias_tolerancia
      'En Contabilidad',             // 3. status
      historyEntry,                  // 4. r_compras
      userId,                        // 5. updated_by
      id                             // 6. WHERE id = ?
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo: existe[0].codigo,
      modulo: 'compras',
      accion: 'Actualización de compras',
      campoAfectado: 'lead_time,dias_tolerancia,status',
      valorAnterior: {
        lead_time: existe[0].lead_time,
        dias_tolerancia: existe[0].dias_tolerancia,
        status: existe[0].status
      },
      valorNuevo: {
        lead_time,
        dias_tolerancia,
        status: 'En Contabilidad'
      },
      usuarioId: userId,
      usuarioNombre: userName || 'Compras'
    });

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

export { updateComprasCodigo };