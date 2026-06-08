import bcryptjs from 'bcryptjs';
import pool from '../database.js';
import { crearTokenJWT } from '../middlewares/JWT.js';


// Login de usuario - NO REQUIERE ROL
  const login = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña son requeridos" });
    }

    // Buscar usuario por email
    const [usuarios] = await connection.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ msg: "Email o contraseña incorrectos" });
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const passwordValida = await bcryptjs.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ msg: "Email o contraseña incorrectos" });
    }

    // Generar token JWT
    const token = crearTokenJWT(usuario.id, usuario.rol);

    return res.status(200).json({
      msg: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        username: usuario.username,
        rol: usuario.rol
      }
    });

  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};

// Obtener mi perfil - REQUIERE AUTENTICACIÓN
  const obtenerMiPerfil = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // El usuario autenticado viene en req.user desde el middleware
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }

    const [usuarios] = await connection.query(
      'SELECT id, nombre, cedula, email, username, rol, created_at FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json({
      msg: "Perfil obtenido exitosamente",
      usuario: usuarios[0]
    });

  } catch (err) {
    console.error('Error obteniendo perfil:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};


// Registro de usuario - ROL ADMINISTRADOR
  const registro = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Validar que el usuario sea administrador
    if (req.user?.rol !== 'administrador') {
      return res.status(403).json({ 
        msg: 'Acceso denegado: solo administradores pueden registrar nuevos usuarios' 
      });
    }

    const { email, password, nombre, cedula, rol } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!email || !password || !nombre || !cedula || !rol) {
      return res.status(400).json({ msg: "Debes llenar todos los campos requeridos: email, password, nombre, cedula, rol" });
    }

    // Validar que el email pertenezca a uno de los dominios permitidos
    const emailLower = email.toString().toLowerCase();
    const dominiosValidos = ["@farbiopharma.com", "@inpel.com"];
    const dominioValido = dominiosValidos.some(dominio => emailLower.endsWith(dominio));
    
    if (!dominioValido) {
      return res.status(400).json({ msg: `El correo debe pertenecer a uno de estos dominios: ${dominiosValidos.join(" o ")}` });
    }

    // Validar que la contraseña tenga al menos 14 caracteres
    if (password.length < 14) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 14 caracteres" });
    }

    // Validar que la cédula sea válida y tenga 10 dígitos
    if (!/^\d{10}$/.test(cedula)) {
      return res.status(400).json({ msg: "La cédula debe tener exactamente 10 dígitos" });
    }

    // Verificar que el email no esté registrado
    const [emailExistente] = await connection.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [emailLower]
    );
    if (emailExistente.length > 0) {
      return res.status(400).json({ msg: "El email ya se encuentra registrado" });
    }

    // Verificar que la cédula no esté registrada
    const [cedulaExistente] = await connection.query(
      'SELECT * FROM usuarios WHERE cedula = ?',
      [cedula]
    );
    if (cedulaExistente.length > 0) {
      return res.status(400).json({ msg: "La cédula ya está registrada" });
    }

    // Verificar que el username sea único (si se proporciona)
    if (username) {
      const [usernameExistente] = await connection.query(
        'SELECT * FROM usuarios WHERE username = ?',
        [username]
      );
      if (usernameExistente.length > 0) {
        return res.status(400).json({ msg: "El nombre de usuario ya está en uso" });
      }
    }

    // Encriptar contraseña
    const passwordEncriptada = await bcryptjs.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const [result] = await connection.query(
      'INSERT INTO usuarios (nombre, cedula, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, cedula, emailLower, passwordEncriptada, rol]
    );

    return res.status(201).json({
      msg: "Usuario registrado exitosamente",
      usuario: {
        id: result.insertId,
        nombre,
        cedula,
        email: emailLower,
        rol
      }
    });

  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};

// Obtener todos los usuarios - REQUIERE ROL ADMINISTRADOR
  const obtenerUsuarios = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Validar que el usuario sea administrador
    if (req.user?.rol !== 'administrador') {
      return res.status(403).json({ 
        msg: 'Acceso denegado: solo administradores pueden obtener la lista de usuarios' 
      });
    }

    const [usuarios] = await connection.query('SELECT id, nombre, cedula, email, username, rol, created_at FROM usuarios');

    return res.status(200).json({
      msg: "Usuarios obtenidos exitosamente",
      usuarios
    });

  } catch (err) {
    console.error('Error obteniendo usuarios:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};

// Obtener usuario por ID - REQUIERE ROL ADMINISTRADOR
  const obtenerUsuario = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Validar que el usuario sea administrador
    if (req.user?.rol !== 'administrador') {
      return res.status(403).json({ 
        msg: 'Acceso denegado: solo administradores pueden obtener datos de usuarios' 
      });
    }

    const { id } = req.params;

    const [usuarios] = await connection.query(
      'SELECT id, nombre, cedula, email, username, rol, created_at FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json({
      msg: "Usuario obtenido exitosamente",
      usuario: usuarios[0]
    });

  } catch (err) {
    console.error('Error obteniendo usuario:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};


// Actualizar usuario - REQUIERE ROL ADMINISTRADOR
  const actualizarUsuario = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    // Validar que el usuario exista
    const [usuarioExistente] = await connection.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarioExistente.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Preparar datos a actualizar
    const actualizaciones = {};
    if (nombre) actualizaciones.nombre = nombre;
    if (email) actualizaciones.email = email.toLowerCase();
    if (rol) actualizaciones.rol = rol;

    // Si no hay cambios
    if (Object.keys(actualizaciones).length === 0) {
      return res.status(400).json({ msg: "No hay campos para actualizar" });
    }

    // Construir query dinámicamente
    const campos = Object.keys(actualizaciones).map(key => `${key} = ?`).join(', ');
    const valores = [...Object.values(actualizaciones), id];

    await connection.query(
      `UPDATE usuarios SET ${campos}, updated_at = NOW() WHERE id = ?`,
      valores
    );

    return res.status(200).json({
      msg: "Usuario actualizado exitosamente",
      usuario: { id, ...actualizaciones }
    });

  } catch (err) {
    console.error('Error actualizando usuario:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};

// Eliminar usuario - REQUIERE ROL ADMINISTRADOR
  const eliminarUsuario = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Validar que el usuario sea administrador
    if (req.user?.rol !== 'administrador') {
      return res.status(403).json({ 
        msg: 'Acceso denegado: solo administradores pueden eliminar usuarios' 
      });
    }

    const { id } = req.params;

    const [resultado] = await connection.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json({ msg: "Usuario eliminado exitosamente" });

  } catch (err) {
    console.error('Error eliminando usuario:', err);
    return res.status(500).json({ msg: 'Ocurrió un error en el servidor', error: err.message });
  } finally {
    connection.release();
  }
};

export { login, obtenerMiPerfil, registro, obtenerUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario };