import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('🔧 Iniciando configuración de base de datos local...\n');

    // Conexión inicial sin BD
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      multipleStatements: true
    });

    console.log('✓ Conectado a MySQL\n');

    // 1. Crear base de datos
    console.log('📦 Creando base de datos...');
    await connection.query('CREATE DATABASE IF NOT EXISTS farbiove_Codigos');
    console.log('✓ Base de datos creada\n');

    // Seleccionar BD
    await connection.query('USE farbiove_Codigos');

    // 2. Crear tabla de usuarios
    console.log('👥 Creando tabla de usuarios...');
    const usuariosSQL = fs.readFileSync(
      path.join(process.cwd(), 'src/database/usuarios_table.sql'),
      'utf-8'
    );
    await connection.query(usuariosSQL);
    console.log('✓ Tabla de usuarios creada\n');

    // 3. Crear tabla de códigos
    console.log('📝 Creando tabla de códigos...');
    const codigosSQL = fs.readFileSync(
      path.join(process.cwd(), 'src/database/codigos_table.sql'),
      'utf-8'
    );
    await connection.query(codigosSQL);
    console.log('✓ Tabla de códigos creada\n');

    // 4. Insertar admin
    console.log('🔐 Insertando usuario administrador...');
    const adminSQL = fs.readFileSync(
      path.join(process.cwd(), 'src/database/crear_admin.sql'),
      'utf-8'
    ).split('\n\n')[0]; // Solo el INSERT, no el SELECT
    
    await connection.query(adminSQL);
    console.log('✓ Usuario admin creado\n');

    console.log('✅ Base de datos configurada correctamente!');
    console.log('📋 Credenciales del admin:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: Admin@123456789\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
