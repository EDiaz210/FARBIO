import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useFetch from '../hooks/useFetch';
import storeAuth from '../context/storeAuth';
import { ToastContainer } from 'react-toastify';

const AdminUsuarios = () => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      nombre: '',
      cedula: '',
      email: '',
      username: '',
      password: '',
      rol: 'solicitante'
    }
  });
  
  const { fetchDataBackend } = useFetch();
  const { token } = storeAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditId, setUsuarioEditId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Obtener lista de usuarios
  const obtenerUsuarios = async (mostrarToast = true) => {
    setCargando(true);
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios`;
      const response = await fetchDataBackend(url, null, 'GET', token, mostrarToast);
      if (response?.usuarios) {
        setUsuarios(response.usuarios);
      }
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  // Crear nuevo usuario
  const onSubmit = async (data) => {
    setEnviando(true);
    try {
      let url, method, payload;

      if (editando) {
        // Actualizar usuario
        url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios/${usuarioEditId}`;
        method = 'PUT';
        const { password, ...dataActualizar } = data;
        payload = dataActualizar;
      } else {
        // Crear usuario
        url = `${import.meta.env.VITE_BACKEND_URL}/api/users/registro`;
        method = 'POST';
        payload = data;
      }

      const response = await fetchDataBackend(url, payload, method, token);
      
      if (response) {
        reset();
        setMostrarForm(false);
        setEditando(false);
        setUsuarioEditId(null);
        // Recargar lista de usuarios sin mostrar toast duplicado
        obtenerUsuarios(false);
      }
    } finally {
      setEnviando(false);
    }
  };

  // Editar usuario
  const handleEditar = (usuario) => {
    reset({
      nombre: usuario.nombre,
      cedula: usuario.cedula,
      email: usuario.email,
      username: usuario.username || '',
      password: '',
      rol: usuario.rol
    });
    setUsuarioEditId(usuario.id);
    setEditando(true);
    setMostrarForm(true);
  };

  // Eliminar usuario
  const handleEliminar = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios/${id}`;
        const response = await fetchDataBackend(url, null, 'DELETE', token);
        if (response) {
          // Remover el usuario de la lista localmente sin hacer otra llamada
          setUsuarios(usuarios.filter(u => u.id !== id));
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  // Cancelar edición
  const handleCancelar = () => {
    reset();
    setMostrarForm(false);
    setEditando(false);
    setUsuarioEditId(null);
  };

  // Cargar usuarios al montar
  useEffect(() => {
    obtenerUsuarios();
  }, []);

  return (
    <div className="w-full bg-white p-6 min-h-screen" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#17243D] mb-2">Gestión de Usuarios</h1>
            <p className="text-gray-600">Crea, edita y elimina usuarios del sistema</p>
          </div>
          <button
            onClick={() => {
              setMostrarForm(!mostrarForm);
              if (mostrarForm) handleCancelar();
            }}
            className="bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 px-6 rounded-lg transition"
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-[#f8f9fa] p-8 rounded-lg mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-[#17243D] mb-6">
              {editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="flex flex-col">
                  <label className="text-[#17243D] font-semibold mb-2">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                    {...register('nombre', { required: 'El nombre es obligatorio' })}
                  />
                  {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>}
                </div>

                {/* Cédula */}
                <div className="flex flex-col">
                  <label className="text-[#17243D] font-semibold mb-2">Cédula (10 dígitos) *</label>
                  <input
                    type="text"
                    placeholder="Ej: 1234567890"
                    className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                    {...register('cedula', {
                      required: 'La cédula es obligatoria',
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'La cédula debe tener exactamente 10 dígitos'
                      }
                    })}
                  />
                  {errors.cedula && <p className="text-red-600 text-sm mt-1">{errors.cedula.message}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label className="text-[#17243D] font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    placeholder="usuario@farbiopaharma.com"
                    className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: {
                        value: /^[^@]+@(farbiopharma\.com|inpel\.com)$/,
                        message: 'Usa email @farbiopharma.com o @inpel.com'
                      }
                    })}
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Username */}
                <div className="flex flex-col">
                  <label className="text-[#17243D] font-semibold mb-2">Username (opcional)</label>
                  <input
                    type="text"
                    placeholder="juanperez"
                    className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                    {...register('username')}
                  />
                </div>

                {/* Rol */}
                <div className="flex flex-col">
                  <label className="text-[#17243D] font-semibold mb-2">Rol *</label>
                  <select
                    className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                    {...register('rol', { required: 'El rol es obligatorio' })}
                  >
                    <option value="administrador">Administrador</option>
                    <option value="solicitante">Solicitante</option>
                    <option value="compras">Compras</option>
                    <option value="contabilidad">Contabilidad</option>
                    <option value="maestrodedatos">Maestro de Datos</option>
                  </select>
                </div>

                {/* Password - Solo si no está editando */}
                {!editando && (
                  <div className="flex flex-col">
                    <label className="text-[#17243D] font-semibold mb-2">Contraseña (mín. 14 caracteres) *</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••"
                      className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                      {...register('password', {
                        required: editando ? false : 'La contraseña es obligatoria',
                        minLength: {
                          value: 14,
                          message: 'La contraseña debe tener mínimo 14 caracteres'
                        }
                      })}
                    />
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-8 pt-4 border-t border-gray-300">
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {enviando ? (editando ? 'Actualizando...' : 'Creando...') : (editando ? 'Actualizar' : 'Crear')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div>
          <h2 className="text-2xl font-bold text-[#17243D] mb-4">Lista de Usuarios</h2>
          
          {cargando ? (
            <p className="text-gray-600 py-8 text-center">Cargando usuarios...</p>
          ) : usuarios.length > 0 ? (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full">
                <thead className="bg-[#17243D] text-white">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Cédula</th>
                    <th className="p-3 text-left">Rol</th>
                    <th className="p-3 text-left">Creado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => (
                    <tr key={usuario.id} className={index % 2 === 0 ? 'bg-[#f8f9fa]' : 'bg-white'}>
                      <td className="p-3 text-[#17243D]">{usuario.id}</td>
                      <td className="p-3 text-[#17243D] font-medium">{usuario.nombre}</td>
                      <td className="p-3 text-[#17243D]">{usuario.email}</td>
                      <td className="p-3 text-[#17243D]">{usuario.username || '-'}</td>
                      <td className="p-3 text-[#17243D]">{usuario.cedula}</td>
                      <td className="p-3">
                        <span className="px-3 py-1 bg-[#dee2e6] text-[#17243D] rounded-full text-sm font-semibold">
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="p-3 text-[#17243D]">
                        {new Date(usuario.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditar(usuario)}
                            className="bg-[#17243D] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminar(usuario.id)}
                            className="bg-[#EF3340] hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 py-8 text-center">No hay usuarios registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsuarios;
