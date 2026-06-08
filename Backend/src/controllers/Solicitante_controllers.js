import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';



  // CREAR CÓDIGO (Solo SOLICITANTE)
  const createCodigo = async (req, res) => {
  const { 
    descripcionSolicitante, 
    detalles, 
    link_referencia,
    RequestorArea,
    userId,
    userName
  } = req.body;

  const AREA_OPTIONS = [
    'BODEGA MATERIALES',
    'BODEGA PRODUCTO TERMINADO',
    'CARTERA',
    'COMERCIAL HUMANA',
    'COMERCIAL VETERINARIA',
    'COMPRAS E IMPORTACIONES',
    'CONTABILIDAD',
    'CONTROL DE CALIDAD',
    'DCRAV',
    'DIRECCION TECNICA',
    'DISEÑO',
    'ESTABILIDADES',
    'FACTURACION',
    'GERENCIA GENERAL',
    'GESTION DEL TALENTO',
    'INVESTIGACION Y DESARROLLO',
    'MANTENIMIENTO',
    'MARKETING',
    'PLANIFICACION',
    'PRODUCCION BIOLOGICOS',
    'PRODUCCION EL CARMEN',
    'PRODUCCION EXTRACTOS',
    'PRODUCCION HUMANA',
    'PRODUCCION VETERINARIA',
    'SEGURIDAD INDUSTRIAL',
    'SUBGERENCIA GENERAL',
    'VALIDACIONES',
  ];

  try {
    // Validar que sea solicitante
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);
    
    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = userResults[0].rol.toLowerCase();
    if (!userRole.includes('solicitante')) {
      return res.status(403).json({ success: false, message: 'Solo solicitante puede crear códigos' });
    }

    // Validaciones básicas
    if (!detalles || !link_referencia || !descripcionSolicitante || !RequestorArea) {
      return res.status(400).json({ success: false, message: 'Detalles, link de referencia, descripción y área son requeridos' });
    }

    // Validar área
    if (!AREA_OPTIONS.includes(RequestorArea)) {
      return res.status(400).json({ success: false, message: `Área inválida. Debe ser una de: ${AREA_OPTIONS.join(', ')}` });
    }

    // Crear historial inicial
    const historyEntry = JSON.stringify([{
      usuario: userName || 'Solicitante',
      fecha: new Date().toISOString().split('T')[0]
    }]);
    

    const insertQuery = `
      INSERT INTO codigos 
      (status, descripcion, requestor_area, detalles, link_referencia, r_creacion, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await pool.query(insertQuery, [
      'Nuevo',                // 1. status
      descripcionSolicitante, // 2. descripcion
      RequestorArea,          // 3. requestor_area
      detalles,               // 4. detalles
      link_referencia,        // 5. link_referencia
      historyEntry,           // 6. r_creacion (JSON con historial)
      userId                  // 7. created_by 
    ]);

    await registrarReporteCodigo({
      codigoId: insertResult.insertId,
      codigo: null,
      modulo: 'creacion',
      accion: 'Creación de código',
      campoAfectado: 'descripcion,requestor_area,detalles,link_referencia,status',
      valorAnterior: null,
      valorNuevo: {
        status: 'Nuevo',
        descripcion: descripcionSolicitante,
        requestor_area: RequestorArea,
        detalles,
        link_referencia
      },
      usuarioId: userId,
      usuarioNombre: userName || 'Solicitante'
    });

    res.status(201).json({ success: true, message: 'Código creado exitosamente', id: insertResult.insertId });
    console.log('Código creado exitosamente');
    
  } catch (error) {
    console.error('Error detallado:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'El código ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear código', error: error.message });
    console.error('Error al crear código:', error);
  }
};



  // UPDATE CONTABILIDAD SOLICITANTE
  const updateSolicitante = async (req, res) => {
  const { id } = req.params;
  const { 
    descripcionSolicitante, 
    detalles, 
    link_referencia,
    RequestorArea,
    userId,
    userName
  } = req.body;

  try {
    // 1. Validar usuario y rol
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);
    
    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = userResults[0].rol.toLowerCase();
    if (!userRole.includes('solicitante')) {
      return res.status(403).json({ success: false, message: 'Solo el solicitante puede editar esta fase' });
    }

    // 2. Validar existencia del registro
    const queryExistencia = 'SELECT id, codigo, descripcion, detalles, link_referencia, status FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, message: 'El código no existe' });
    }

    // 3. Validaciones de campos
    if (!detalles || !link_referencia || !descripcionSolicitante || !RequestorArea) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    // Validar área
    if (!AREA_OPTIONS.includes(RequestorArea)) {
      return res.status(400).json({ success: false, message: `Área inválida. Debe ser una de: ${AREA_OPTIONS.join(', ')}` });
    }

    // Preparar JSONs
    const historyEntry = JSON.stringify([{
      usuario: userName || 'Solicitante',
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Actualización Solicitante'
    }]);

    const codigoAnterior = existe[0];
    
    // 4. Query corregida (Sin la "f" y con nombres de columnas revisados)
    const updateQuery = `
      UPDATE codigos 
      SET 
        descripcion = ?, 
        requestor_area = ?,
        detalles = ?, 
        link_referencia = ?, 
        r_creacion = ?, 
        updated_by = ?
      WHERE id = ?
    `;

    await pool.query(updateQuery, [
      descripcionSolicitante, 
      RequestorArea,
      detalles, 
      link_referencia, 
      historyEntry, 
      userId, 
      id 
    ]);

    await registrarReporteCodigo({
      codigoId: id,
      codigo: codigoAnterior.codigo,
      modulo: 'creacion',
      accion: 'Actualización de solicitud',
      campoAfectado: 'descripcion,requestor_area,detalles,link_referencia',
      valorAnterior: {
        descripcion: codigoAnterior.descripcion,
        requestor_area: codigoAnterior.requestor_area,
        detalles: codigoAnterior.detalles,
        link_referencia: codigoAnterior.link_referencia,
        status: codigoAnterior.status
      },
      valorNuevo: {
        descripcion: descripcionSolicitante,
        requestor_area: RequestorArea,
        detalles,
        link_referencia,
        status: codigoAnterior.status
      },
      usuarioId: userId,
      usuarioNombre: userName || 'Solicitante'
    });

    console.log(`Código ${id} actualizado exitosamente por ${userName}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Código actualizado exitosamente' 
    });
    
  } catch (error) {
    console.error('Error en updateSolicitante:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno al actualizar', 
      error: error.message 
    });
  }
};



  // SOLICITUDES DE CADA SOLICITANTE
  const getSolicitudesPorUsuario = async (req, res) => {
  const idFinal = req.params.userid;
  console.log("DEBUG: ID recibido ->", idFinal);
  // Verificamos que el ID sea un número válido
  if (!idFinal) {
    return res.status(400).json({ success: false, message: 'ID de usuario no proporcionado' });
  }

  try {
    const query = `
      SELECT 
        id, 
        codigo,           
        descripcion,     
        status, 
        created_at
      FROM codigos 
      WHERE created_by = ? 
      ORDER BY id DESC
    `;
    
    const [rows] = await pool.query(query, [idFinal]);
    
    res.status(200).json({ 
      success: true, 
      data: rows 
    });

  } catch (error) {
    // Esto imprimirá el error real en la terminal de tu VS Code (Node.js)
    console.error('ERROR EN SQL:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error en la consulta de base de datos',
      error: error.message 
    });
  }
};



export { createCodigo, updateSolicitante, getSolicitudesPorUsuario };