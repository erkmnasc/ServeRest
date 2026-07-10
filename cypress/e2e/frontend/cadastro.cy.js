import registerUserPage from '../../pages/RegisterUserPage'
import adminHomePage from '../../pages/AdminHomePage'
import { buildUser } from '../../utils/dataFactory'
import * as serverestApi from '../../support/api/serverestApi'

describe('Frontend | Cadastro de usuário', () => {
  context('Cenário 4: cadastro de administrador pela interface', () => {
    const newAdmin = buildUser({ administrador: 'true' })

    after(() => {
      // O id não é exposto na UI: localiza o usuário criado pelo email para remoção
      serverestApi.getUsers({ email: newAdmin.email }).then(({ body }) => {
        const createdUser = body.usuarios?.[0]
        if (createdUser) {
          serverestApi.deleteUser(createdUser._id)
        }
      })
    })

    it('deve cadastrar, autenticar automaticamente e redirecionar para a área administrativa', () => {
      registerUserPage.visit().fillForm(newAdmin).submit()

      adminHomePage.assertIsVisibleFor(newAdmin.nome)
      cy.screenshot('cenario-4-cadastro-admin-sucesso')
    })
  })

  context('Cenário 5: cadastro com email já utilizado', () => {
    let existingUser

    before(() => {
      cy.createUserViaApi().then((user) => {
        existingUser = user
      })
    })

    after(() => {
      if (existingUser?.id) serverestApi.deleteUser(existingUser.id)
    })

    it('deve exibir mensagem de erro e não criar o cadastro', () => {
      registerUserPage
        .visit()
        .fillForm(buildUser({ email: existingUser.email }))
        .submit()

      registerUserPage.assertRegisterError('Este email já está sendo usado')
      cy.url().should('include', '/cadastrarusuarios')
      cy.screenshot('cenario-5-cadastro-email-duplicado-erro')
    })
  })
})
