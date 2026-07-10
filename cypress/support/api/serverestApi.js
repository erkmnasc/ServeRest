/**
 * Service Layer Pattern
 * Encapsula todas as chamadas HTTP à API ServeRest em um único módulo.
 * Os specs consomem estas funções e concentram-se apenas nas assertivas.
 *
 * `failOnStatusCode: false` delega a validação do status code às assertivas,
 * permitindo verificar explicitamente fluxos felizes e de erro.
 */

const apiUrl = (path) => `${Cypress.env('apiUrl')}${path}`

// ---------- /login ----------

export const postLogin = (credentials) =>
  cy.request({
    method: 'POST',
    url: apiUrl('/login'),
    body: credentials,
    failOnStatusCode: false,
  })

// ---------- /usuarios ----------

export const postUser = (user) =>
  cy.request({
    method: 'POST',
    url: apiUrl('/usuarios'),
    body: user,
    failOnStatusCode: false,
  })

export const getUsers = (query = {}) =>
  cy.request({
    method: 'GET',
    url: apiUrl('/usuarios'),
    qs: query,
    failOnStatusCode: false,
  })

export const getUserById = (id) =>
  cy.request({
    method: 'GET',
    url: apiUrl(`/usuarios/${id}`),
    failOnStatusCode: false,
  })

export const putUser = (id, user) =>
  cy.request({
    method: 'PUT',
    url: apiUrl(`/usuarios/${id}`),
    body: user,
    failOnStatusCode: false,
  })

export const deleteUser = (id) =>
  cy.request({
    method: 'DELETE',
    url: apiUrl(`/usuarios/${id}`),
    failOnStatusCode: false,
  })

// ---------- /produtos ----------

export const postProduct = (product, authorization = null) =>
  cy.request({
    method: 'POST',
    url: apiUrl('/produtos'),
    body: product,
    headers: authorization ? { Authorization: authorization } : {},
    failOnStatusCode: false,
  })

export const getProducts = (query = {}) =>
  cy.request({
    method: 'GET',
    url: apiUrl('/produtos'),
    qs: query,
    failOnStatusCode: false,
  })

export const getProductById = (id) =>
  cy.request({
    method: 'GET',
    url: apiUrl(`/produtos/${id}`),
    failOnStatusCode: false,
  })

export const deleteProduct = (id, authorization) =>
  cy.request({
    method: 'DELETE',
    url: apiUrl(`/produtos/${id}`),
    headers: { Authorization: authorization },
    failOnStatusCode: false,
  })
