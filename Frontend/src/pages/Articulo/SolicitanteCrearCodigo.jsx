import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
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

const SolicitanteCrearCodigo = () => {
  const navigate = useNavigate();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  // Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Formulario
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ defaultValues });

  // Derivaciones de estado / Claims
  const claims = getAuthClaims(token);
  const userID = claims?.id || null;
  const nombreSolicitante = perfilUsuario?.nombre;

  // Cargar datos del perfil para la UI
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!token) {
        setPerfilUsuario(null);
        return;
      }

      setCargandoUsuario(true);
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/mi-perfil`;
        const response = await fetchDataBackend(url, null, "GET", token, false);
        if (response?.usuario) {
          setPerfilUsuario(response.usuario);
        }
      } catch (error) {
        console.error("Error al cargar perfil de usuario:", error);
      } finally {
        setCargandoUsuario(false);
      }
    };

    cargarDatosUsuario();
  }, [token, fetchDataBackend]);

  // Manejo de envío
  const createCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreSolicitante,
        descripcionSolicitante: data.RequestorDescription,
        RequestorArea: data.RequestorArea,
        detalles: data.Details,
        link_referencia: data.ReferenceLink,
        userId: userID,
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/solicitante/codigos/create`;
      const response = await fetchDataBackend(url, codigoData, 'POST', token);

      if (response?.success) {
        toast.success('Código creado exitosamente');
        reset();
        setTimeout(() => {
          navigate('/dashboard/tablas');
        }, 1500);
      } else {
        toast.error(response?.message || 'Error al crear el código');
      }
    } catch (error) {
      console.error('Error al crear el código:', error);
      toast.error('Error al crear el código');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full py-8 overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full max-w-4xl px-6 lg:px-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Solicitar Nuevo Código</h1>
          <p className="text-sm text-slate-600 mt-2">Completa los datos del artículo que deseas solicitar</p>
        </div>

        <form onSubmit={handleSubmit(createCodigo)} className="space-y-6">
          <fieldset className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <legend className="text-lg font-semibold text-slate-900 px-2">Información del Código</legend>
            
            <div className="grid gap-6 pt-6">
              {/* Descripción */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Descripción *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol 500mg"
                  autoComplete="off"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('RequestorDescription', {
                    required: 'La descripción es obligatoria',
                    minLength: {
                      value: 5,
                      message: 'La descripción debe tener al menos 5 caracteres'
                    }
                  })}
                />
                {errors.RequestorDescription && (
                  <p className="text-sm text-red-600">{errors.RequestorDescription.message}</p>
                )}
              </div>

              {/* Área solicitante */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Área Solicitante *
                </label>
                <select
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('RequestorArea', {
                    required: 'El área solicitante es obligatoria'
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

              {/* Detalles */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Detalles *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe detalladamente el artículo que necesitas"
                  className="w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                  {...register('Details', {
                    required: 'Los detalles son obligatorios',
                    minLength: {
                      value: 10,
                      message: 'Los detalles deben tener al menos 10 caracteres'
                    }
                  })}
                />
                {errors.Details && (
                  <p className="text-sm text-red-600">{errors.Details.message}</p>
                )}
              </div>

              {/* Link de Referencia */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Link de Referencia (Opcional)
                </label>
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

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Código'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitanteCrearCodigo;
