import { faker } from '@faker-js/faker'

/**
 * Data Factory Pattern
 * Centraliza a geração de massa de dados dinâmica, garantindo independência
 * e repetibilidade dos testes em uma base compartilhada (sem dados hardcoded).
 */

export const buildUser = (overrides = {}) => ({
  nome: faker.person.fullName(),
  email: faker.internet.email({ provider: 'qa.serverest.dev' }).toLowerCase(),
  password: faker.internet.password({ length: 12 }),
  administrador: 'true',
  ...overrides,
})

export const buildProduct = (overrides = {}) => ({
  // Sufixo alfanumérico evita colisão de nomes na base pública,
  // já que a API rejeita produtos com nome duplicado
  nome: `${faker.commerce.productName()} ${faker.string.alphanumeric(8)}`,
  preco: faker.number.int({ min: 10, max: 999 }),
  descricao: faker.commerce.productDescription(),
  quantidade: faker.number.int({ min: 1, max: 100 }),
  ...overrides,
})

/**
 * Gera um id sintaticamente válido (16 caracteres alfanuméricos, padrão da API),
 * porém inexistente na base — útil para cenários de "não encontrado".
 */
export const buildNonexistentId = () => faker.string.alphanumeric(16)
