import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';

const EditarUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      nombre: '',
      cedula: '',
      email: '',
      username: '',
      rol: 'solicitante',
    },
  });

  useEffect(() => {
    const obtenerUsuario = async () => {
      if (!token || !id) return;

      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token);

        if (response?.usuario) {
          setUsuario(response.usuario);
        } else {
          toast.error(response?.msg || 'No se pudo cargar el usuario');
          navigate('/dashboard/admin/usuarios');
        }
      } catch (error) {
        console.error('Error obteniendo el usuario:', error);
        toast.error('Error cargando el usuario');
        navigate('/dashboard/admin/usuarios');
      } finally {
        setLoading(false);
      }
    };

    obtenerUsuario();
  }, [id, token, fetchDataBackend, navigate]);

  useEffect(() => {
    if (!usuario) return;

    reset({
      nombre: usuario.nombre || '',
      cedula: usuario.cedula || '',
      email: usuario.email || '',
      username: usuario.username || '',
      rol: usuario.rol || 'solicitante',
    });
  }, [usuario, reset]);

  const handleExit = () => {
    navigate('/dashboard/admin/usuarios');
  };

  const onSubmit = async (data) => {
    if (!usuario) return;

    setEnviando(true);

    try {
      const payload = {
        nombre: data.nombre,
        cedula: data.cedula,
        email: data.email,
        username: data.username || null,
        rol: data.rol,
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/usuarios/${usuario.id}`;
      const response = await fetchDataBackend(url, payload, 'PUT', token);

      if (response?.usuario) {
        toast.success('Usuario actualizado correctamente');
        handleExit();
      } else {
        toast.error(response?.msg || 'No se pudo actualizar el usuario');
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      toast.error('Error actualizando el usuario');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <div className="text-center py-16 text-slate-500">Cargando usuario...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <ToastContainer />
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <div className="text-center py-16 text-slate-500">No se encontró el usuario seleccionado.</div>
            <div className="mt-6 text-center">
              <button
                onClick={handleExit}
                className="rounded-[28px] border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Administración de usuarios</p>
            <h1 className="text-4xl font-semibold text-slate-950">Editar usuario</h1>
            <p className="max-w-2xl text-slate-600">Actualiza los datos del usuario seleccionado.</p>
          </div>
        </div>

        <div className="bg-[#f8f9fa] p-8 rounded-lg mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#17243D]">Editar Usuario</h2>
              <p className="text-gray-600 mt-1">Actualiza la información del usuario seleccionado.</p>
            </div>
            <button
              onClick={handleExit}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-5 py-3 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    message: 'La cédula debe tener exactamente 10 dígitos',
                  },
                })}
              />
              {errors.cedula && <p className="text-red-600 text-sm mt-1">{errors.cedula.message}</p>}
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2">Email *</label>
              <input
                type="email"
                placeholder="usuario@farbiopharma.com"
                className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: {
                    value: /^[^@]+@(farbiopharma\.com|inpel\.com)$/,
                    message: 'Usa email @farbiopharma.com o @inpel.com',
                  },
                })}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2">Username (opcional)</label>
              <input
                type="text"
                placeholder="juanperez"
                className="p-3 bg-[#dee2e6] rounded-lg text-[#17243D] focus:outline-none focus:ring-2 focus:ring-[#17243D]"
                {...register('username')}
              />
            </div>

            <div className="flex flex-col md:col-span-2">
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
              {errors.rol && <p className="text-red-600 text-sm mt-1">{errors.rol.message}</p>}
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-4 mt-4">
              <button
                type="submit"
                disabled={enviando}
                className="bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50"
              >
                {enviando ? 'Actualizando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={handleExit}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarUsuario;
