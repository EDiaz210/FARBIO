import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import storeAuth from '../../context/storeAuth';
import useFetch from '../../hooks/useFetch';

const CrearUsuarioPage = () => {
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

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

  const [enviando, setEnviando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleExit = () => {
    navigate('/dashboard/admin/usuarios');
  };

  const onSubmit = async (data) => {
    setEnviando(true);

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/registro`;
      const response = await fetchDataBackend(url, data, 'POST', token);

      if (response?.usuario) {
        toast.success('Usuario creado correctamente');
        reset();
        handleExit();
      } else {
        toast.error(response?.msg || 'No se pudo crear el usuario');
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      toast.error('Error creando el usuario');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Administración de usuarios</p>
            <h1 className="text-4xl font-semibold text-slate-950">Crear nuevo usuario</h1>
            <p className="max-w-2xl text-slate-600">Registra un nuevo usuario para que pueda acceder al sistema.</p>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
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
                <label className="text-slate-800 font-semibold mb-2">Contraseña (mín. 14 caracteres) *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••"
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: {
                        value: 14,
                        message: 'La contraseña debe tener mínimo 14 caracteres',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.05 10.05 0 0112 20c-6 0-10-8-10-8a18.92 18.92 0 014.05-5.48" />
                        <path d="M1 1l22 22" />
                        <path d="M9.88 9.88a3 3 0 014.24 4.24" />
                      </svg>
                    )}
                  </button>
                </div>
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
                {enviando ? 'Creando...' : 'Crear usuario '}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearUsuarioPage;
