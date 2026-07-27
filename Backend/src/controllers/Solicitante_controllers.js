import pool from '../database.js';
import axios from 'axios';
import { registrarReporteCodigo } from '../utils/reportesCodigos.js';
import { notificarResumenPorEstado } from '../telegram/telegramService.js'; 
import {buildDynamicUpdate} from '../utils/dbHelpers.js';


  // CREAR CÓDIGO (Solo SOLICITANTE)
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

const EMPRESA_OPTIONS = [
  'FARBIOPHARMA',
  'INPEL',
  'CLAREL',
];

  const createCodigo = async (req, res) => {
  const {
    nombreSolicitante,
    descripcionSolicitante, 
    detalles, 
    link_referencia,
    RequestorArea,
    empresa, 
    userId,
    userName
  } = req.body;

  try {
    // Validar que sea solicitante
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);
    
    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no validado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (!userRole.includes('solicitante')) {
      return res.status(403).json({ success: false, msg: 'Solo solicitante puede crear códigos' });
    }

    // Validaciones básicas
    if (!detalles || !link_referencia || !descripcionSolicitante || !RequestorArea || !nombreSolicitante || !empresa) {
      return res.status(400).json({ success: false, msg: 'Detalles, link de referencia, descripción, área, nombre del solicitante y empresa son requeridos' });
    }

    // Validar área
    if (!AREA_OPTIONS.includes(RequestorArea)) {
      return res.status(400).json({ success: false, msg: `Área inválida. Debe ser una de: ${AREA_OPTIONS.join(', ')}` });
    }

    // Validar empresa
    if (!EMPRESA_OPTIONS.includes(empresa)) {
      return res.status(400).json({ success: false, msg: `Empresa inválida. Debe ser una de: ${EMPRESA_OPTIONS.join(', ')}` });
    }

    // Crear historial inicial
    const historyEntry = JSON.stringify([{
      usuario: userName || nombreSolicitante || 'Solicitante',
      fecha: new Date().toISOString().split('T')[0],
      accion : 'Creación incial de solicitud'
    }]);
    

    const insertQuery = `
      INSERT INTO codigos 
      (status, descripcion, requestor_area, detalles, link_referencia, r_creacion, created_by, nombre_solicitante, empresa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await pool.query(insertQuery, [
      'Nuevo',                // 1. status
      descripcionSolicitante, // 2. descripcion
      RequestorArea,          // 3. requestor_area
      detalles,               // 4. detalles
      link_referencia,        // 5. link_referencia
      historyEntry,           // 6. r_creacion (JSON con historial)
      userId,                 // 7. created_by
      nombreSolicitante,      // 8. nombre_solicitante
      empresa                 // 9. empresa
    ]);

    const newId = insertResult.insertId;

    await registrarReporteCodigo({
      codigoId: newId,
      codigo: null,
      modulo: 'creacion',
      accion: 'Creación de código',
      campoAfectado: 'descripcion,requestor_area,detalles,link_referencia,status,nombre_solicitante, empresa',
      valorAnterior: null,
      valorNuevo: {
        status: 'Nuevo',
        descripcion: descripcionSolicitante,
        requestor_area: RequestorArea,
        detalles,
        link_referencia,
        nombre_solicitante: nombreSolicitante,
        empresa: empresa
      },
      usuarioId: userId,
      usuarioNombre: nombreSolicitante 
    });

    try {
      await notificarResumenPorEstado('Nuevo', descripcionSolicitante, 'Nueva solicitud de código creada');    
    } catch (telegramError) {
      console.error('Error enviando notificación de Telegram:', telegramError);
    }
    
    res.status(201).json({ success: true, msg: 'Código creado exitosamente', id: insertResult.insertId });
    console.log('Código creado exitosamente');

    
  } catch (error) {
    console.error('Error detallado:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, msg: 'El código ya existe' });
    }
    res.status(500).json({ success: false, message: 'Error al crear código', error: error.message });
    console.error('Error al crear código:', error);
  }
};



  // UPDATE CONTABILIDAD SOLICITANTE

  const SOLICITANTE_FIELDS_MAPPING = {
  descripcionSolicitante: 'descripcion',
  RequestorArea: 'requestor_area',
  detalles: 'detalles',
  link_referencia: 'link_referencia',
  nombreSolicitante: 'nombre_solicitante',
  empresa: 'empresa' // Mapeo correcto: req.body.empresa -> columna 'empresa' en MySQL
};

const updateSolicitante = async (req, res) => {
  const { id } = req.params;
  const {
    userId,
    userName,
    RequestorArea,
    empresa
  } = req.body;

  try {
    // 1. Validar usuario y rol
    const userQuery = 'SELECT rol FROM usuarios WHERE id = ?';
    const [userResults] = await pool.query(userQuery, [userId]);
    
    if (!userResults || userResults.length === 0) {
      return res.status(401).json({ success: false, msg: 'Usuario no validado' });
    }

    const userRole = (userResults[0].rol || '').toLowerCase();
    if (!userRole.includes('solicitante') && !userRole.includes('admin')) {
      return res.status(403).json({ success: false, msg: 'Solo el solicitante o un administrador puede editar esta fase' });
    }

    // 2. Validar existencia del registro
    const queryExistencia = 'SELECT * FROM codigos WHERE id = ?';
    const [existe] = await pool.query(queryExistencia, [id]);
    
    if (existe.length === 0) {
      return res.status(404).json({ success: false, msg: 'El código no existe' });
    }

    const codigoAnterior = existe[0];

    // 3. Validar opciones permitidas
    if (RequestorArea && typeof AREA_OPTIONS !== 'undefined' && !AREA_OPTIONS.includes(RequestorArea)) {
      return res.status(400).json({ 
        success: false, 
        msg: `Área inválida. Debe ser una de: ${AREA_OPTIONS.join(', ')}` 
      });
    }

    if (empresa && !EMPRESA_OPTIONS.includes(empresa)) {
      return res.status(400).json({
        success: false,
        msg: `Empresa inválida. Debe ser una de: ${EMPRESA_OPTIONS.join(', ')}`
      });
    }

    // 4. Evaluar cambios dinámicamente (incluye 'empresa')
    const { setClause, values, changedFields, hasChanges } = buildDynamicUpdate(
      codigoAnterior, 
      req.body, 
      SOLICITANTE_FIELDS_MAPPING
    );

    if (!hasChanges) {
      return res.status(200).json({ success: true, msg: 'No se realizaron cambios en el código' });
    }

    // 5. Historial acumulativo
    let currentHistory = [];
    try {
      currentHistory = JSON.parse(codigoAnterior.r_creacion || '[]');
      if (!Array.isArray(currentHistory)) currentHistory = [currentHistory];
    } catch (parseError) {
      currentHistory = [];
    }

    currentHistory.push({
      usuario: userName || codigoAnterior.nombre_solicitante || 'Solicitante',
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Actualización de Solicitante',
      camposModificados: Object.keys(changedFields)
    });

    // 6. Actualización en la Base de Datos
    const finalSetClause = `${setClause}, r_creacion = ?, status = ?, updated_by = ?`;
    const finalValues = [...values, JSON.stringify(currentHistory), 'Nuevo', userId, id];

    const updateQuery = `UPDATE codigos SET ${finalSetClause} WHERE id = ?`;
    await pool.query(updateQuery, finalValues);

    // 7. Preparación de datos para auditoría
    const valorAnteriorLimpiado = {};
    const valorNuevoLimpiado = {};

    for (const [columna, datos] of Object.entries(changedFields)) {
      valorAnteriorLimpiado[columna] = datos.anterior;
      valorNuevoLimpiado[columna] = datos.nuevo;
    }

    await registrarReporteCodigo({
      codigoId: id,
      codigo: codigoAnterior.codigo,
      modulo: 'creacion',
      accion: 'Actualización de Solicitante',
      campoAfectado: Object.keys(changedFields).join(','),
      valorAnterior: valorAnteriorLimpiado,
      valorNuevo: valorNuevoLimpiado,
      usuarioId: userId,
      usuarioNombre: userName || codigoAnterior.nombre_solicitante
    });

    console.log(`Código ${id} actualizado exitosamente por ${userName}. Campos alterados:`, Object.keys(changedFields));
    
    return res.status(200).json({ 
      success: true, 
      msg: 'Código actualizado exitosamente', 
      camposModificados: Object.keys(changedFields)
    });
    
  } catch (error) {
    console.error('Error en updateSolicitante:', error);
    return res.status(500).json({ 
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