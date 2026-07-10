import Ajv from 'ajv'
import { buildUser } from '../utils/dataFactory'
import * as serverestApi from './api/serverestApi'
import loginPage from '../pages/LoginPage'

const ajv = new Ajv({ allErrors: true })

/**
 * Cria um usuário via API (setup de estado por API — mais rápido e estável
 * do que preparar massa pela interface) e retorna o usuário com o id gerado.
 */
Cypress.Commands.add('createUserViaApi', (overrides = {}) => {
  const user = buildUser(overrides)

  return serverestApi.postUser(user).then((response) => {
    expect(response.status, 'setup: criação de usuário via API').to.eq(201)
    return cy.wrap({ ...user, id: response.body._id }, { log: false })
  })
})

/**
 * Obtém um token de autenticação via API para uso em rotas protegidas.
 * Obs.: o token da ServeRest expira em 600s — suficiente para uma execução.
 */
Cypress.Commands.add('getAuthToken', ({ email, password }) => {
  return serverestApi.postLogin({ email, password }).then((response) => {
    expect(response.status, 'setup: autenticação via API').to.eq(200)
    return cy.wrap(response.body.authorization, { log: false })
  })
})

/**
 * Realiza login pela interface utilizando cy.session, que cacheia a sessão
 * (localStorage) entre testes e specs, reduzindo o tempo de execução.
 * Usar apenas quando o login NÃO for o comportamento sob teste.
 */
Cypress.Commands.add('loginViaUi', (user) => {
  cy.session(
    user.email,
    () => {
      loginPage.visit().loginWith(user)
      cy.url().should('include', '/admin/home')
    },
    { cacheAcrossSpecs: true },
  )
})

/**
 * Valida o contrato de uma resposta da API contra um JSON Schema (AJV).
 */
Cypress.Commands.add('validateSchema', (body, schema) => {
  const validate = ajv.compile(schema)
  const isValid = validate(body)

  expect(isValid, `contrato da resposta — ${JSON.stringify(validate.errors)}`).to.be.true
})
