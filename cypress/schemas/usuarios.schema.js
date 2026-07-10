export const userSchema = {
  type: 'object',
  required: ['nome', 'email', 'password', 'administrador', '_id'],
  properties: {
    nome: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
    administrador: { type: 'string', enum: ['true', 'false'] },
    _id: { type: 'string', pattern: '^[a-zA-Z0-9]{16}$' },
  },
  additionalProperties: false,
}
