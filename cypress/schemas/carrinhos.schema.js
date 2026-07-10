const idPattern = '^[a-zA-Z0-9]{16}$'

export const cartSchema = {
  type: 'object',
  required: ['produtos', 'precoTotal', 'quantidadeTotal', 'idUsuario', '_id'],
  properties: {
    produtos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['idProduto', 'quantidade', 'precoUnitario'],
        properties: {
          idProduto: { type: 'string', pattern: idPattern },
          quantidade: { type: 'integer' },
          precoUnitario: { type: 'integer' },
        },
        additionalProperties: false,
      },
    },
    precoTotal: { type: 'integer' },
    quantidadeTotal: { type: 'integer' },
    idUsuario: { type: 'string', pattern: idPattern },
    _id: { type: 'string', pattern: idPattern },
  },
  additionalProperties: false,
}

export const cartListSchema = {
  type: 'object',
  required: ['quantidade', 'carrinhos'],
  properties: {
    quantidade: { type: 'integer' },
    carrinhos: { type: 'array', items: cartSchema },
  },
  additionalProperties: false,
}
