export const ITEM_TYPES = [
  { Code: 'B', Name: 'BIEN' },
  { Code: 'S', Name: 'SERVICIO' },
  { Code: 'A', Name: 'ACTIVO' }
];

const ROLE_FIELD_PERMISSIONS = {
  contabilidad: ['ItemsGroupCode', 'ItemType'],
  compras: ['LeadTimeInDays', 'ToleranceDays'],
  solicitante: ['RequestorDescription', 'Details', 'ReferenceLink']
};

export const isFieldEnabled = (userRole, fieldName) => {
  if (!userRole) return false;
  if (userRole.includes('maestro') || userRole.includes('master')) return true;
  const allowedFields = ROLE_FIELD_PERMISSIONS[userRole] || [];
  return allowedFields.includes(fieldName);
};
