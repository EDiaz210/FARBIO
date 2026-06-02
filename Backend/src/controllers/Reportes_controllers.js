import pool from '../database.js';

const obtenerTiempoEsperaSAP = async (req, res) => {
  const { id } = req.params;

  try {
    const baseQuery = `
      SELECT
        c.id,
        c.codigo,
        c.created_at AS fecha_creacion,
        MIN(rc.created_at) AS fecha_envio_sap,
        TIMESTAMPDIFF(MINUTE, c.created_at, MIN(rc.created_at)) AS minutos_espera,
        TIMESTAMPDIFF(HOUR, c.created_at, MIN(rc.created_at)) AS horas_espera,
        ROUND(TIMESTAMPDIFF(MINUTE, c.created_at, MIN(rc.created_at)) / 60, 2) AS horas_espera_decimal
      FROM codigos c
      INNER JOIN reportes_codigos rc
        ON rc.codigo_id = c.id
       AND rc.modulo IN ('maestrodatos', 'sap')
      ${id ? 'WHERE c.id = ?' : ''}
      GROUP BY c.id, c.codigo, c.created_at
      ORDER BY c.created_at DESC
    `;

    const params = id ? [id] : [];
    const [rows] = await pool.query(baseQuery, params);

    if (id && rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un envío a SAP para ese código'
      });
    }

    const resumenQuery = `
      SELECT
        COUNT(*) AS total_codigos_enviados,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, c.created_at, rc_envio.fecha_envio)) / 60, 2) AS promedio_horas_espera,
        ROUND(MIN( TIMESTAMPDIFF(MINUTE, c.created_at, rc_envio.fecha_envio) ) / 60, 2) AS menor_horas_espera,
        ROUND(MAX( TIMESTAMPDIFF(MINUTE, c.created_at, rc_envio.fecha_envio) ) / 60, 2) AS mayor_horas_espera
      FROM codigos c
      INNER JOIN (
        SELECT codigo_id, MIN(created_at) AS fecha_envio
        FROM reportes_codigos
        WHERE modulo IN ('maestrodatos', 'sap')
        GROUP BY codigo_id
      ) rc_envio ON rc_envio.codigo_id = c.id
    `;

    const [resumenRows] = await pool.query(resumenQuery);

    return res.status(200).json({
      success: true,
      message: id
        ? 'Tiempo de espera del código calculado exitosamente'
        : 'Tiempo de espera de códigos calculado exitosamente',
      data: id ? rows[0] : rows,
      resumen: resumenRows[0] || null
    });
  } catch (error) {
    console.error('Error calculando tiempo de espera SAP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al calcular el tiempo de espera hacia SAP',
      error: error.message
    });
  }
};

export { obtenerTiempoEsperaSAP };