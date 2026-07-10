import loginPage from '../../pages/LoginPage'
import adminHomePage from '../../pages/AdminHomePage'
import clientHomePage from '../../pages/ClientHomePage'
import { buildUser } from '../../utils/dataFactory'
import * as serverestApi from '../../support/api/serverestApi'

describe('Frontend | Login', () => {
  context('Cenário 1: login de administrador com credenciais válidas', () => {
    let admin

    before(() => {
      // Setup de estado via API: mais rápido e determinístico do que via UI
      cy.createUserViaApi({ administrador: 'true' }).then((user) => {
        admin = user
      })
    })

    after(() => {
      if (admin?.id) serverestApi.deleteUser(admin.id)
    })

    it('deve autenticar e redirecionar para a área administrativa', () => {
      loginPage.visit().loginWith(admin)

      adminHomePage.assertIsVisibleFor(admin.nome)
      adminHomePage.elements.logoutButton().should('be.visible')
    })
  })

  context('Cenário 2: login de usuário comum com credenciais válidas', () => {
    let commonUser

    before(() => {
      cy.createUserViaApi({ administrador: 'false' }).then((user) => {
        commonUser = user
      })
    })

    after(() => {
      if (commonUser?.id) serverestApi.deleteUser(commonUser.id)
    })

    it('deve autenticar e redirecionar para a vitrine de compras', () => {
      loginPage.visit().loginWith(commonUser)

      clientHomePage.assertIsVisible()
    })
  })

  context('Cenário 3: login com credenciais inválidas', () => {
    it('deve exibir mensagem de erro e manter o usuário na tela de login', () => {
      loginPage.visit().loginWith(buildUser())

      loginPage.assertLoginError('Email e/ou senha inválidos')
    })
  })
})
