import bcryptjs from 'bcryptjs';

const password = 'Farbio@1235678';
const saltRounds = 10;

const hashPassword = async () => {
  try {
    const hash = await bcryptjs.hash(password, saltRounds);
    console.log('\n=== HASH GENERADO ===');
    console.log('Contraseña:', password);
    console.log('Hash:', hash);
    console.log('\nCopia el hash para usarlo en la BD');
  } catch (error) {
    console.error('Error:', error);
  }
};

hashPassword();
