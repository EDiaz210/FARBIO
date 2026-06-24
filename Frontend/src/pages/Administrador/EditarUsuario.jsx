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
      password: '',
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
      password: '',
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
        password: data.password || null,
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

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-slate-800 font-semibold mb-2">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                />
                {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-slate-800 font-semibold mb-2">Cédula (10 dígitos) *</label>
                <input
                  type="text"
                  placeholder="Ej: 1234567890"
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                <label className="text-slate-800 font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="usuario@farbiopharma.com"
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                <label className="text-slate-800 font-semibold mb-2">Rol *</label>
                <select
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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

              <div className="flex flex-col md:col-span-2">
                <label className="text-slate-800 font-semibold mb-2">Contraseña (mín. 14 caracteres)</label>
                <input
                  type="password"
                  placeholder="••••••••••••••"
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  {...register('password', {
                    minLength: {
                      value: 14,
                      message: 'La contraseña debe tener mínimo 14 caracteres',
                    },
                  })}
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-end mt-4">
              <button
                type="button"
                onClick={handleExit}
                className="rounded-[28px] border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="rounded-[28px] bg-[#17243D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {enviando ? 'Actualizando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarUsuario;
