import { ToastContainer } from 'react-toastify';

const ArticuloFormLayout = ({
  title,
  description,
  loading,
  isSubmitting,
  id,
  userRole,
  vatGroups,
  itemsGroups,
  itemTypes,
  register,
  errors,
  handleSubmit,
  onSubmit,
  onSecondarySubmit,
  onBuscarItem,
  submitButtonText,
  secondaryButtonText,
  showSecondaryButton,
  isFieldEnabled
}) => {
  const canBuscarSAP = userRole.includes('maestro') || userRole.includes('master');

  return (
    <div className="w-full bg-white p-4" style={{ fontFamily: 'Gowun Batang, serif' }}>
      <ToastContainer />
      <h1 className="text-2xl font-bold text-[#17243D] mb-1">{title}</h1>
      <p className="text-gray-600 mb-6">{loading ? 'Cargando datos...' : description}</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-8">
          <div className="flex-1 max-w-sm space-y-4">
            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Código</label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isFieldEnabled('ItemCode')}
                  className={`p-4 rounded-3xl text-[#17243D] w-full ${
                    isFieldEnabled('ItemCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('ItemCode')}
                />
                <button
                  type="button"
                  disabled={!canBuscarSAP}
                  onClick={onBuscarItem}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full w-12 h-12 flex items-center justify-center transition ${
                    !canBuscarSAP
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-[#17243D] text-white hover:bg-[#EF3340]'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Descripción (ItemName)</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ItemName')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ItemName') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register('ItemName')}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Nombre Extranjero</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ForeignName')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ForeignName') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register('ForeignName')}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Descripción Solicitante</label>
              <textarea
                disabled={!isFieldEnabled('RequestorDescription')}
                className={`p-4 rounded-3xl text-[#17243D] min-h-20 resize-none ${
                  isFieldEnabled('RequestorDescription') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register('RequestorDescription')}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Detalles</label>
              <textarea
                disabled={!isFieldEnabled('Details')}
                className={`p-4 rounded-3xl text-[#17243D] min-h-20 resize-none ${
                  isFieldEnabled('Details') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register('Details')}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[#17243D] font-semibold mb-2 text-sm">Link de Referencia</label>
              <input
                type="text"
                disabled={!isFieldEnabled('ReferenceLink')}
                className={`p-4 rounded-3xl text-[#17243D] ${
                  isFieldEnabled('ReferenceLink') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                }`}
                {...register('ReferenceLink')}
              />
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute top-0 right-0 flex flex-col gap-3">
              <div className="flex items-center justify-end gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inventoryItem"
                    disabled={!isFieldEnabled('InventoryItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register('InventoryItem')}
                  />
                  <label htmlFor="inventoryItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Inventario</label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="purchaseItem"
                    disabled={!isFieldEnabled('PurchaseItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register('PurchaseItem')}
                  />
                  <label htmlFor="purchaseItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Compra</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="salesItem"
                    disabled={!isFieldEnabled('SalesItem')}
                    className="w-6 h-6 accent-[#17243D] cursor-pointer disabled:cursor-not-allowed"
                    {...register('SalesItem')}
                  />
                  <label htmlFor="salesItem" className="text-[#17243D] font-medium text-sm cursor-pointer">Item de Venta</label>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-xs">
              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Unidad de Compra</label>
                <input
                  type="text"
                  disabled={!isFieldEnabled('PurchaseUnit')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('PurchaseUnit') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('PurchaseUnit')}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Impuesto Compra (VAT Group)</label>
                <select
                  disabled={!isFieldEnabled('PurchaseTaxCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('PurchaseTaxCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('PurchaseTaxCode')}
                >
                  <option value="">-- Selecciona VAT Group --</option>
                  {vatGroups.length > 0 ? (
                    vatGroups.map((vat, idx) => (
                      <option key={idx} value={vat.Code || vat.id || ''}>
                        {vat.Name || vat.name || vat.Code || vat.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de VAT Groups</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Impuesto Venta (VAT Group)</label>
                <select
                  disabled={!isFieldEnabled('SalesTaxCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('SalesTaxCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('SalesTaxCode')}
                >
                  <option value="">-- Selecciona VAT Group --</option>
                  {vatGroups.length > 0 ? (
                    vatGroups.map((vat, idx) => (
                      <option key={idx} value={vat.Code || vat.id || ''}>
                        {vat.Name || vat.name || vat.Code || vat.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de VAT Groups</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Lead Time (días)</label>
                <input
                  type="number"
                  disabled={!isFieldEnabled('LeadTimeInDays')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('LeadTimeInDays') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('LeadTimeInDays')}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Código Grupo Artículo</label>
                <select
                  disabled={!isFieldEnabled('ItemsGroupCode')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ItemsGroupCode') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('ItemsGroupCode')}
                >
                  <option value="">-- Selecciona Grupo Artículo --</option>
                  {itemsGroups.length > 0 ? (
                    itemsGroups.map((group, idx) => (
                      <option key={idx} value={group.Code || group.id || ''}>
                        {group.Name || group.name || group.Code || group.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de Grupos</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Tipo de Bien</label>
                <select
                  disabled={!isFieldEnabled('ItemType')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ItemType') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('ItemType')}
                >
                  <option value="">-- Selecciona Tipo de Bien --</option>
                  {itemTypes.length > 0 ? (
                    itemTypes.map((type, idx) => (
                      <option key={idx} value={type.Code || type.id || ''}>
                        {type.Name || type.name || type.Code || type.id}
                      </option>
                    ))
                  ) : (
                    <option disabled>Sin datos de Tipos</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[#17243D] font-semibold mb-2 text-sm">Días de Tolerancia</label>
                <input
                  type="number"
                  disabled={!isFieldEnabled('ToleranceDays')}
                  className={`p-4 rounded-3xl text-[#17243D] ${
                    isFieldEnabled('ToleranceDays') ? 'bg-[#dee2e6]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  {...register('ToleranceDays')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-64 text-white font-bold py-3 rounded-full bg-[#17243D] hover:bg-[#EF3340] transition disabled:opacity-50"
          >
            {isSubmitting ? 'Procesando...' : submitButtonText}
          </button>

          {showSecondaryButton && (
            <button
              type="button"
              onClick={handleSubmit(onSecondarySubmit)}
              disabled={isSubmitting}
              className="w-64 bg-[#17243D] hover:bg-[#EF3340] text-white font-bold py-3 rounded-full transition disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando...' : secondaryButtonText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ArticuloFormLayout;
