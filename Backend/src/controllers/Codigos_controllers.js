import pool from '../database.js';


// Obtener código por ID 
  const obtenerCodigoID = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [codigos] = await connection.query(
      'SELECT id, codigo, status, descripcion, detalles, link_referencia, descripcion_sap, nombre_extranjero, lead_time, dias_tolerancia, cantidad_minima_pedido, unidad_compra, grupo_articulos, requestor_area, tipo_bien, unidad_medida, nombre_solicitante, grava_iva, impuesto_compra, impuesto_venta, indicadorIVACompras, indicadorIVAVentas FROM codigos WHERE id = ?',
      [id]
    );

    if (codigos.length === 0) {
      return res.status(404).json({ msg: "Código no encontrado" });
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
    // Si usas GET, los parámetros vienen en .query
    const { status } = req.query; 

    // Validación para depurar:
    if (!status) {
      console.log("Error: Status no recibido");
      return res.status(400).json({ msg: "El status es requerido" });
    }

    const [codigos] = await connection.query(
      'SELECT * FROM codigos WHERE status = ?',
      [status]
    );

    // Devolver array sin mensaje cuando no hay resultados (sin notificación)
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
    // Recibe el ID enviado desde el frontend (?created_by=...)
    const { created_by } = req.query; 
    console.log("ID recibido para created_by:", created_by); // Depuración
    // Validación para depurar en consola:
    if (!created_by) {
      console.log("Error: created_by no recibido desde el frontend");
      return res.status(400).json({ msg: "El ID del creador (created_by) es requerido" });
    }

    // Consulta a la base de datos filtrando por el creador
    const [codigos] = await connection.query(
      'SELECT * FROM codigos WHERE created_by = ? ORDER BY id ASC',
      [created_by]
    );

    // Devolver array con los códigos encontrados
    return res.status(200).json({ codigos });
    console.log(`Códigos obtenidos para created_by=${created_by}:`, codigos);

  } catch (err) {
    console.error('Error obteniendo códigos por usuario:', err);
    return res.status(500).json({ msg: 'Error de servidor' });
  } finally {
    connection.release();
  }
};


const eliminarCodigo = async (req, res) => {
  const { id } = req.params;
  const { userId, userName } = req.body;
  
  try {
    // Validar que el usuario sea solicitante
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);

    if (!userResults.length) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userRole = userResults[0].rol;
    if (userRole !== 'solicitante' && userRole !== 'maestrodedatos') {
      return res.status(403).json({ success: false, message: 'Rol no autorizado' });
    }

    // Eliminar el código
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



export { obtenerCodigoID, obtenerCodigos, obtenerMisCodigos, eliminarCodigo };









