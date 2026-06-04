import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';

const EditarUsuario = ({ token, usuario, onSuccess, onCancel }) => {
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
      username: '',
      rol: 'solicitante',
    },
  });

  const [enviando, setEnviando] = useState(false);

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

  const onSubmit = async (data) => {
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
        onSuccess();
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

  if (!usuario) {
    return (
      <div className="bg-[#f8f9fa] p-8 rounded-lg border border-gray-200">
        <p className="text-gray-600">No se encontró el usuario seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] p-8 rounded-lg mb-8 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#17243D]">Editar Usuario</h2>
          <p className="text-gray-600 mt-1">Actualiza la información del usuario seleccionado.</p>
        </div>
        <button
          onClick={onCancel}
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
            onClick={onCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-8 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarUsuario;
