import mysql from 'mysql2/promise';

async function insertAdmin() {
  try {
    console.log('🔐 Insertando admin con datos personales...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'farbiove_Codigos'
    });

    // Eliminar el admin anterior si existe
    await connection.query('DELETE FROM usuarios WHERE id = 1');

    // Insertar nuevo admin
    const sql = `INSERT INTO usuarios (id, nombre, cedula, email, password, rol, created_at, updated_at) 
VALUES (
    1,
    'Elkin Diaz',
    '1727660902',
    'pasante.ti@farbiopharma.com',
    '$2b$10$cjaP4oSGdKzTfhks57FVbuU45o0xUNTKOYt2qejitYtHf7BLF59.S',
    'administrador',
    NOW(),
    NOW()
)`;

    await connection.query(sql);
    
    console.log('✅ Admin insertado correctamente!\n');
    console.log('📋 Credenciales:');
    console.log('   Email: pasante.ti@farbiopaharma.com\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertAdmin();
