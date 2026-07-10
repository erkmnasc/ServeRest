export const productSchema = {
  type: 'object',
  required: ['nome', 'preco', 'descricao', 'quantidade', '_id'],
  properties: {
    nome: { type: 'string' },
    preco: { type: 'integer' },
    descricao: { type: 'string' },
    quantidade: { type: 'integer' },
    imagem: { type: 'string' },
    _id: { type: 'string', pattern: '^[a-zA-Z0-9]{16}$' },
  },
  additionalProperties: false,
}
