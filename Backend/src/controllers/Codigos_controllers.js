import pool from '../database.js';
import axios from 'axios';


// Obtener código por ID 
  const obtenerCodigoID = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [codigos] = await connection.query(
      'SELECT id, codigo, status, descripcion, detalles, link_referencia, descripcion_sap, lead_time, dias_tolerancia, grupo_articulos, tipo_bien FROM codigos WHERE id = ?',
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
    return res.status(500).json({ msg: 'Error de servidor' });
  } finally {
    connection.release();
  }
};

export { obtenerCodigoID, obtenerCodigos };








