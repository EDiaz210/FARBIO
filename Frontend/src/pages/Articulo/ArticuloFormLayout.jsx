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

const ArticuloFormLayout = ({
  title,
  description,
  loading,
  isSubmitting,
  register,
  errors,
  handleSubmit,
  onSubmit,
  submitButtonText,
  showSecondaryButton,
  secondaryButtonText,
  onSecondarySubmit,
}) => {
  return (
    <div className="min-h-full py-8 overflow-auto" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />

      <div className="w-full max-w-6xl px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-semibold text-slate-900 mt-2">Crear Código</h1>
          <p className="text-sm text-slate-600 mt-1">Completa los datos del artículo que deseas solicitar</p>
        </div>

        <div className="w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
            <fieldset className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 border-slate-300 px-4">
              <legend className="ml-2 px-2 text-sm font-semibold text-slate-900">Datos del Artículo</legend>
              <div className="grid gap-6 w-full pt-4">
                <div className="space-y-2 w-full">
                  <label className="block text-sm font-semibold text-slate-900">Descripción *</label>
                  <input
                    type="text"
                    autoComplete="off"
                    className="w-full rounded-[24px] border px-4 py-3 text-slate-900 outline-none transition border-[#DADADA] bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
                    {...register('RequestorDescription', { required: 'La descripción es obligatoria' })}
                    aria-invalid={errors.RequestorDescription ? 'true' : 'false'}
                  />
                  {errors.RequestorDescription && (
                    <p className="text-sm text-red-600">{errors.RequestorDescription.message}</p>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <label className="block text-sm font-semibold text-slate-900">Detalles *</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-[24px] border px-4 py-3 text-slate-900 outline-none transition border-[#DADADA] bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
                    {...register('Details', { required: 'Los detalles son obligatorios' })}
                    aria-invalid={errors.Details ? 'true' : 'false'}
                  />
                  {errors.Details && <p className="text-sm text-red-600">{errors.Details.message}</p>}
                </div>

                <div className="space-y-2 w-full">
                  <label className="block text-sm font-semibold text-slate-900">Link de Referencia</label>
                  <input
                    type="url"
                    placeholder="https://"
                    className="w-full rounded-[24px] border px-4 py-3 text-slate-900 outline-none transition border-[#DADADA] bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
                    {...register('ReferenceLink')}
                  />
                  {errors.ReferenceLink && <p className="text-sm text-red-600">{errors.ReferenceLink.message}</p>}
                </div>

                <div className="space-y-2 w-full">
                  <label className="block text-sm font-semibold text-slate-900">Área solicitante *</label>
                  <select
                    className="w-full rounded-[24px] border px-4 py-3 text-slate-900 outline-none transition border-[#DADADA] bg-white focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
                    {...register('RequestorArea', { required: 'El área solicitante es obligatoria' })}
                    aria-invalid={errors.RequestorArea ? 'true' : 'false'}
                  >
                    <option value="">Selecciona un área</option>
                    {AREA_OPTIONS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  {errors.RequestorArea && <p className="text-sm text-red-600">{errors.RequestorArea.message}</p>}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-[24px] bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f1b35] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando...' : (submitButtonText || 'Crear Código')}
                </button>

                {showSecondaryButton && (
                  <button
                    type="button"
                    onClick={handleSubmit(onSecondarySubmit)}
                    disabled={isSubmitting}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-[24px] border border-[#DADADA] bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Procesando...' : secondaryButtonText}
                  </button>
                )}
              </div>
            </fieldset>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ArticuloFormLayout;
