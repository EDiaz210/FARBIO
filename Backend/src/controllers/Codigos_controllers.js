import pool from '../database.js';


// Obtener código por ID 
  const obtenerCodigoID = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userRole = (req.user?.rol || '').toLowerCase();
    const userId = req.user?.id;

    let query = 'SELECT c.id, c.codigo, c.status, c.descripcion, c.detalles, c.link_referencia, c.descripcion_sap, c.nombre_extranjero, c.lead_time, c.dias_tolerancia, c.cantidad_minima_pedido, c.unidad_compra, c.grupo_articulos, c.requestor_area, c.tipo_bien, c.unidad_medida, c.nombre_solicitante, c.grava_iva, c.impuesto_compra, c.impuesto_venta, c.indicadorIVACompras, c.indicadorIVAVentas, c.empresa, c.compras_responsable_id, c.compras_enviado_por, c.created_by, u.nombre AS responsable_compras FROM codigos c LEFT JOIN usuarios u ON u.id = c.compras_responsable_id WHERE c.id = ?';
    const params = [id];

    if (userRole.includes('solicitante')) {
      query += ' AND c.created_by = ?';
      params.push(userId);
    } else if (userRole.includes('compras')) {
      query += ' AND (c.compras_responsable_id IS NULL OR c.compras_responsable_id = ?)';
      params.push(userId);
    }

    const [codigos] = await connection.query(query, params);

    if (codigos.length === 0) {
      return res.status(404).json({ msg: "Código no encontrado o no autorizado" });
    }

    return res.status(200).json({
      msg: "Código obtenido exitosamente",
      codigo: codigos[0]
    });

  } catch (err) {
    console.error('Error obteniendo código:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};


// Obtener códigos por filtro status
  const obtenerCodigos = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { status, created_by } = req.query;
    const userRole = (req.user?.rol || '').toLowerCase();
    const authenticatedUserId = req.user?.id;

    if (!status) {
      console.log('Error: Status no recibido');
      return res.status(400).json({ msg: 'El status es requerido' });
    }

    let query = 'SELECT * FROM codigos WHERE status = ?';
    const params = [status];

    // Seguridad: los solicitantes solo deben ver sus propios códigos aunque usen la búsqueda genérica
    if (userRole.includes('solicitante')) {
      query += ' AND created_by = ?';
      params.push(authenticatedUserId);
    } else if (userRole.includes('compras')) {
      query += ' AND (compras_responsable_id IS NULL OR compras_responsable_id = ?)';
      params.push(authenticatedUserId);
    } else if (created_by) {
      query += ' AND created_by = ?';
      params.push(created_by);
    }

    const [codigos] = await connection.query(query, params);

    return res.status(200).json({ codigos });

  } catch (err) {
    console.error('Error obteniendo códigos:', err);
    return res.status(500).json({ msg: 'Error de servidor' });
  } finally {
    connection.release();
  }
};

// Obtener todos los códigos creados por el usuario actual
const obtenerMisCodigos = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userRole = (req.user?.rol || '').toLowerCase();
    const requesterId = Number(req.user?.id);
    const requestedUserId = req.query.created_by ? Number(req.query.created_by) : requesterId;

    if (!requestedUserId && !requesterId) {
      console.log('Error: created_by no recibido desde el frontend');
      return res.status(400).json({ msg: 'El ID del creador (created_by) es requerido' });
    }

    if (userRole.includes('solicitante') && requestedUserId !== requesterId) {
      return res.status(403).json({ msg: 'No puedes ver códigos de otro solicitante' });
    }

    const [codigos] = await connection.query(
      `SELECT * FROM codigos
       WHERE created_by = ?
         AND (status <> 'Finalizado' OR created_at >= DATE_SUB(NOW(), INTERVAL 20 DAY))
       ORDER BY id ASC`,
      [requestedUserId]
    );

    return res.status(200).json({ codigos });

  } catch (err) {
    console.error('Error obteniendo códigos por usuario:', err);
    return res.status(500).json({ msg: 'Error de servidor' });
  } finally {
    connection.release();
  }
};


const eliminarCodigo = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userName = req.user?.nombre || req.user?.name || null;
  
  try {
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);

    if (!userResults.length) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (userRole !== 'solicitante' && userRole !== 'maestrodedatos') {
      return res.status(403).json({ success: false, message: 'Rol no autorizado' });
    }

    if (userRole.includes('solicitante')) {
      const [codigo] = await pool.query('SELECT created_by FROM codigos WHERE id = ?', [id]);
      if (!codigo.length) {
        return res.status(404).json({ success: false, message: 'Código no encontrado' });
      }
      if (Number(codigo[0].created_by) !== Number(userId)) {
        return res.status(403).json({ success: false, message: 'No puedes eliminar un código que no te pertenece' });
      }
    }

    const deleteQuery = 'DELETE FROM codigos WHERE id = ?';
    const [deleteResults] = await pool.query(deleteQuery, [id]);

    if (deleteResults.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Código no encontrado' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Código eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error en eliminarCodigo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al eliminar', 
      error: error.message 
    });
  }
};

// Obtener códigos enviados por el usuario actual de Compras
const obtenerMisCodigosCompras = async (req, res) => {
  try {
    const userRole = (req.user?.rol || '').toLowerCase();
    const userId = req.user?.id;

    if (!userRole.includes('compras')) {
      return res.status(403).json({ msg: 'Solo los usuarios de Compras pueden consultar esta bandeja' });
    }

    const [codigos] = await pool.query(
      `SELECT c.id, c.codigo, c.descripcion, c.status, c.nombre_solicitante,
            c.compras_responsable_id, c.compras_enviado_por, c.created_at, c.updated_at,
            u.nombre AS responsable_compras
       FROM codigos c
       LEFT JOIN usuarios u ON u.id = c.compras_responsable_id
       WHERE c.compras_enviado_por = ?
       ORDER BY c.updated_at DESC, c.id DESC`,
      [userId]
    );

    return res.status(200).json({ codigos });
  } catch (err) {
    console.error('Error obteniendo códigos enviados por Compras:', err);
    return res.status(500).json({ msg: 'Error de servidor' });
  }
};



export { obtenerCodigoID, obtenerCodigos, obtenerMisCodigos, obtenerMisCodigosCompras, eliminarCodigo };









