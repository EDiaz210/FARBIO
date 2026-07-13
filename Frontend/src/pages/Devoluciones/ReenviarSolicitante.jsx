import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import storeAuth from '../../context/storeAuth';
import { getAuthClaims } from '../../utils/authClaims';
import { ToastContainer } from 'react-toastify';

const AREA_OPTIONS = [
  'BODEGA MATERIALES',
  'BODEGA PRODUCTO TERMINADO',
  'CARTERA',
  'COMERCIAL HUMANA',
  'COMERCIAL VETERINARIA',
  'COMPRAS E IMPORTACIONES',
  'CONTABILIDAD',
  'CONTROL DE CALIDAD',
  'DCRAV',
  'DIRECCION TECNICA',
  'DISEÑO',
  'ESTABILIDADES',
  'FACTURACION',
  'GERENCIA GENERAL',
  'GESTION DEL TALENTO',
  'INVESTIGACION Y DESARROLLO',
  'MANTENIMIENTO',
  'MARKETING',
  'PLANIFICACION',
  'PRODUCCION BIOLOGICOS',
  'PRODUCCION EL CARMEN',
  'PRODUCCION EXTRACTOS',
  'PRODUCCION HUMANA',
  'PRODUCCION VETERINARIA',
  'SEGURIDAD INDUSTRIAL',
  'SUBGERENCIA GENERAL',
  'VALIDACIONES',
];

const defaultValues = {
  RequestorDescription: '',
  RequestorArea: '',
  Details: '',
  ReferenceLink: '',
};

const ReenviarSolicitante = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ defaultValues });

  const claims = getAuthClaims(token);
  const userID = claims?.id || null;
  const nombreSolicitante = perfilUsuario?.nombre;

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) {
        setPerfilUsuario(null);
        return;
      }

      setCargandoUsuario(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/mi-perfil`;
        const response = await fetchDataBackend(url, null, 'GET', token, false);
        if (response?.usuario) {
          setPerfilUsuario(response.usuario);
        }
      } catch (error) {
        console.error('Error al cargar perfil de usuario:', error);
      } finally {
        setCargandoUsuario(false);
      }
    };

    cargarDatosUsuario();
  }, [token, fetchDataBackend]);

  useEffect(() => {
    const cargarDatosCodigo = async () => {
      if (!id) {
        setCargandoDatos(false);
        return;
      }

      setCargandoDatos(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/codigos/${id}`;
        const response = await fetchDataBackend(url, null, 'GET', token, false);

        if (response?.codigo) {
          const codigo = response.codigo;
          reset({
            RequestorDescription: codigo.descripcion || '',
            RequestorArea: codigo.requestor_area || '',
            Details: codigo.detalles || '',
            ReferenceLink: codigo.link_referencia || '',
          });
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/solicitante/rechazados'), 1500);
        }
      } catch (error) {
        console.error('Error al cargar el código:', error);
        toast.error('Error al cargar el código');
        setTimeout(() => navigate('/dashboard/solicitante/rechazados'), 1500);
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatosCodigo();
  }, [id, token, fetchDataBackend, reset, navigate]);

  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreSolicitante,
        descripcionSolicitante: data.RequestorDescription,
        RequestorArea: data.RequestorArea,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        userId: userID,
        userName: nombreSolicitante,
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/${id}`;
      const response = await fetchDataBackend(url, codigoData, 'PUT', token);

      if (response?.success) {
        toast.success('Código actualizado exitosamente');
        setTimeout(() => {
          navigate('/dashboard/solicitante/rechazados');
        }, 1500);
      } else {
        toast.error(response?.message || 'Error al actualizar el código');
      }
    } catch (error) {
      console.error('Error al actualizar el código:', error);
      toast.error('Error al actualizar el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="min-h-full py-8 flex items-center justify-center" style={{ fontFamily: 'Gowun Batang, serif' }}>
        <div className="text-center">
          <p className="text-slate-600">Cargando datos del código...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] text-white shadow-sm">
        <div className="px-6 lg:px-8 py-4 lg:py-5">
          <h1 className="text-4xl font-bold">Reenviar a Solicitante - Código #{id}</h1>
          <p className="mt-1 text-sm text-white/90">Actualiza los datos de tu solicitud</p>
        </div>
      </div>

      <div className="w-full max-w-4xl px-6 lg:px-8 mx-auto py-8">
        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          <fieldset className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Descripción *</label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol 500mg"
                  autoComplete="off"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('RequestorDescription', {
                    required: 'La descripción es obligatoria',
                    minLength: {
                      value: 5,
                      message: 'La descripción debe tener al menos 5 caracteres',
                    },
                  })}
                />
                {errors.RequestorDescription && (
                  <p className="text-sm text-red-600">{errors.RequestorDescription.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Área Solicitante *</label>
                <select
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('RequestorArea', {
                    required: 'El área solicitante es obligatoria',
                  })}
                >
                  <option value="">Selecciona un área</option>
                  {AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {errors.RequestorArea && (
                  <p className="text-sm text-red-600">{errors.RequestorArea.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Detalles *</label>
                <textarea
                  rows={4}
                  placeholder="Describe detalladamente el artículo que necesitas"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('Details', {
                    required: 'Los detalles son obligatorios',
                    minLength: {
                      value: 10,
                      message: 'Los detalles deben tener al menos 10 caracteres',
                    },
                  })}
                />
                {errors.Details && (
                  <p className="text-sm text-red-600">{errors.Details.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Link de Referencia (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('ReferenceLink')}
                />
                {errors.ReferenceLink && (
                  <p className="text-sm text-red-600">{errors.ReferenceLink.message}</p>
                )}
              </div>
            </div>
          </fieldset>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/solicitante/rechazados')}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReenviarSolicitante;
