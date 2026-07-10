export const loginSuccessSchema = {
  type: 'object',
  required: ['message', 'authorization'],
  properties: {
    message: { type: 'string' },
    authorization: { type: 'string', pattern: '^Bearer .+' },
  },
  additionalProperties: false,
}
