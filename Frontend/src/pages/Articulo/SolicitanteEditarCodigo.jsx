import { useState, useEffect, useCallback } from 'react';
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

const EMPRESA_OPTIONS = [
  'FARBIOPHARMA',
  'INPEL',
  'CLAREL',
];

const defaultValues = {
  Empresa: '',
  RequestorArea: '',
  RequestorDescription: '',
  Details: '',
  ReferenceLink: '',
};

const SolicitanteEditarCodigo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = storeAuth();
  const { fetchDataBackend } = useFetch();

  // Estados
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Validadores custom
  const validateDescripcion = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'La descripción es obligatoria';
    }

    const trimmed = value.trim();

    if (trimmed.length < 10) {
      return 'La descripción debe tener mínimo 10 caracteres';
    }
    if (trimmed.length > 100) {
      return 'La descripción debe tener máximo 100 caracteres';
    }

    return true;
  }, []);

  const validateDetalles = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'Los detalles son obligatorios';
    }

    const trimmed = value.trim();

    if (trimmed.length < 30) {
      return 'Los detalles deben tener mínimo 30 caracteres';
    }
    if (trimmed.length > 300) {
      return 'Los detalles deben tener máximo 300 caracteres';
    }

    return true;
  }, []);

  const validateLink = useCallback((value) => {
    if (!value || value.trim() === '') {
      return 'El enlace es obligatorio';
    }

    const trimmed = value.trim();

    if (trimmed.length > 900) {
      return 'El enlace debe tener máximo 900 caracteres';
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'El enlace debe comenzar con http:// o https://';
    }

    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'El protocolo debe ser http o https';
      }

      if (!url.hostname || url.hostname === '') {
        return 'Ingresa un enlace URL válido';
      }

      return true;
    } catch (error) {
      return 'Ingresa un enlace URL válido (http://ejemplo.com o https://ejemplo.com)';
    }
  }, []);

  // Formulario
  const {
    register,
    handleSubmit,
    formState: { errors, isValidating },
    reset,
    watch,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues,
  });

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

  // Cargar datos del código a editar
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
            Empresa: codigo.empresa || '',
            RequestorDescription: codigo.descripcion || '',
            RequestorArea: codigo.requestor_area || '',
            Details: codigo.detalles || '',
            ReferenceLink: codigo.link_referencia || '',
          });
        } else {
          toast.error('No se pudo cargar el código');
          setTimeout(() => navigate('/dashboard/tablas'), 1500);
        }
      } catch (error) {
        console.error('Error al cargar el código:', error);
        toast.error('Error al cargar el código');
        setTimeout(() => navigate('/dashboard/tablas'), 1500);
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatosCodigo();
  }, [id, token, fetchDataBackend, reset, navigate]);

  // Manejo de envío
  const updateCodigo = async (data) => {
    try {
      setIsSubmitting(true);

      const codigoData = {
        nombreSolicitante,
        descripcionSolicitante: data.RequestorDescription,
        RequestorArea: data.RequestorArea,
        empresa: data.Empresa,
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
          navigate('/dashboard/tablas');
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
          <h1 className="text-4xl font-bold">Editar Código #{id}</h1>
          <p className="mt-1 text-sm text-white/90">Actualiza los datos de tu solicitud</p>
        </div>
      </div>

      <div className="w-full max-w-4xl px-6 lg:px-8 mx-auto py-8">
        <form onSubmit={handleSubmit(updateCodigo)} className="space-y-6">
          <fieldset className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 pt-2">
              {/* Empresa */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Empresa *
                </label>
                <select
                  className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errors.Empresa
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'
                  }`}
                  {...register('Empresa', {
                    required: 'La empresa es obligatoria',
                  })}
                >
                  <option value="">Selecciona una empresa</option>
                  {EMPRESA_OPTIONS.map((empresa) => (
                    <option key={empresa} value={empresa}>
                      {empresa}
                    </option>
                  ))}
                </select>
                {errors.Empresa && (
                  <p className="text-sm text-red-600">{errors.Empresa.message}</p>
                )}
              </div>

              {/* Área solicitante */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Área Solicitante *
                </label>
                <select
                  className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errors.RequestorArea
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'
                  }`}
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

              {/* Descripción */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Descripción *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol 500mg"
                  autoComplete="off"
                  className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errors.RequestorDescription
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'
                  }`}
                  {...register('RequestorDescription', { validate: validateDescripcion })}
                />
                {errors.RequestorDescription && (
                  <p className="text-sm text-red-600">{errors.RequestorDescription.message}</p>
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
                  className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errors.Details
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'
                  }`}
                  {...register('Details', { validate: validateDetalles })}
                />
                {errors.Details && (
                  <p className="text-sm text-red-600">{errors.Details.message}</p>
                )}
              </div>

              {/* Link de Referencia */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Link de Referencia *
                </label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com"
                  className={`w-full rounded-lg border px-4 py-3 text-slate-900 outline-none transition focus:ring-2 ${
                    errors.ReferenceLink
                      ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-50'
                  }`}
                  {...register('ReferenceLink', { validate: validateLink })}
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
              type="button"
              onClick={() => navigate('/dashboard/tablas')}
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit" 
              disabled={isSubmitting || isValidating}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#274C77] via-[#2F5D8A] to-[#1F3F5B] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Actualizando...' : isValidating ? 'Validando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitanteEditarCodigo;
