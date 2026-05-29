import pool from './src/database.js';

const recreateCodigosTable = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Iniciando recreación de tabla codigos...');
    
    // 1. Eliminar tabla antigua si existe
    console.log('🗑️  Eliminando tabla antigua...');
    await connection.query('DROP TABLE IF EXISTS codigos');
    console.log('✅ Tabla antigua eliminada');
    
    // 2. Crear tabla nueva
    console.log('📝 Creando tabla nueva...');
    const createTableQuery = `
      CREATE TABLE codigos (
        id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
        codigo VARCHAR(35)  ,
        
        -- Campos principales
        status VARCHAR(25) DEFAULT 'nuevo', -- nuevo, pendiente, finalizado
        descripcion VARCHAR(100),
        detalles VARCHAR(100),
        link_referencia VARCHAR(50),
        descripcion_sap VARCHAR(100),
        
        -- Campos numéricos
        cantidad INT,
        lead_time INT,
        dias_tolerancia INT,
        
        -- Clasificaciones
        grupo_articulos VARCHAR(100),
        tipo_bien VARCHAR(50),
        indicadorIVACompras varchar(30),
        indicadorIVAVentas varchar(30),

        
        -- Historial de cambios (JSON)
        -- Formato: [{"usuario": "nombre", "fecha": "2026-05-11"}]
        r_creacion JSON,
        r_compras JSON,
        r_contabilidad JSON,
        r_maestrodatos JSON,
        r_sap JSON,

        -- Checksbox para seguimiento de cambios
        inventoryItem varchar(5),
        salesItem varchar(5),
        manageBatchNumbers varchar(5),
        purchaseItem varchar(5),
        manageSerialNumbers varchar(5),
        
        -- Control de quién crea y actualiza
        created_by INT,
        updated_by INT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Relaciones
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL,
        
        -- Índices para búsquedas rápidas
        INDEX idx_id (id),
        INDEX idx_codigo (codigo),
        INDEX idx_status (status),
        INDEX idx_grupo_articulos (grupo_articulos),
        INDEX idx_tipo_bien (tipo_bien),
        INDEX idx_created_by (created_by),
        INDEX idx_updated_by (updated_by),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableQuery);
    console.log('✅ Tabla codigos creada exitosamente');
    
    console.log('\n✨ Proceso completado con éxito');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la recreación:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
};

recreateCodigosTable();
