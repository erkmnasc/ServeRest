/**
 * Schemas compartilhados para validação de contrato (AJV).
 * Os ids da ServeRest possuem exatamente 16 caracteres alfanuméricos,
 * regra extraída dos schemas Joi da própria API.
 */

export const recordCreatedSchema = {
  type: 'object',
  required: ['message', '_id'],
  properties: {
    message: { type: 'string' },
    _id: { type: 'string', pattern: '^[a-zA-Z0-9]{16}$' },
  },
  additionalProperties: false,
}
