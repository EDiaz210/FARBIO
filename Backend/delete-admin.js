import mysql from 'mysql2/promise';

async function deleteAdmin() {
  try {
    console.log('🗑️  Eliminando usuario admin...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'farbiove_Codigos'
    });

    // Eliminar el admin
    await connection.query('DELETE FROM usuarios WHERE id = 1');
    
    console.log('✅ Usuario admin eliminado correctamente!\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAdmin();
