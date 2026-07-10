import * as serverestApi from '../../support/api/serverestApi'
import { buildUser } from '../../utils/dataFactory'
import { loginSuccessSchema } from '../../schemas/login.schema'

describe('API | POST /login', () => {
  let user

  before(() => {
    cy.createUserViaApi().then((createdUser) => {
      user = createdUser
    })
  })

  after(() => {
    if (user?.id) serverestApi.deleteUser(user.id)
  })

  context('Cenários positivos', () => {
    it('deve autenticar com credenciais válidas e retornar um token Bearer', () => {
      serverestApi.postLogin({ email: user.email, password: user.password }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message).to.eq('Login realizado com sucesso')
        expect(response.body.authorization).to.match(/^Bearer .+/, 'token no formato Bearer')

        cy.validateSchema(response.body, loginSuccessSchema)
      })
    })
  })

  context('Cenários negativos', () => {
    it('não deve autenticar com senha incorreta [401]', () => {
      serverestApi
        .postLogin({ email: user.email, password: 'senha-incorreta-123' })
        .then((response) => {
          expect(response.status).to.eq(401)
          expect(response.body.message).to.eq('Email e/ou senha inválidos')
          expect(response.body).to.not.have.property('authorization')
        })
    })

    it('não deve autenticar email não cadastrado, retornando a mesma mensagem genérica [401]', () => {
      // A API responde de forma idêntica para email inexistente e senha incorreta,
      // não expondo se o email está cadastrado (proteção contra enumeração de usuários)
      serverestApi
        .postLogin({ email: buildUser().email, password: 'qualquer-senha' })
        .then((response) => {
          expect(response.status).to.eq(401)
          expect(response.body.message).to.eq('Email e/ou senha inválidos')
        })
    })

    it('deve rejeitar email com formato inválido [400]', () => {
      serverestApi
        .postLogin({ email: 'email-sem-formato-valido', password: 'qualquer-senha' })
        .then((response) => {
          expect(response.status).to.eq(400)
          // Erros de validação de campo retornam o formato { "campo": "mensagem" }
          expect(response.body).to.deep.eq({ email: 'email deve ser um email válido' })
        })
    })

    it('deve rejeitar requisição sem o campo password [400]', () => {
      serverestApi.postLogin({ email: user.email }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({ password: 'password é obrigatório' })
      })
    })

    it('deve rejeitar requisição sem o campo email [400]', () => {
      serverestApi.postLogin({ password: 'qualquer-senha' }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({ email: 'email é obrigatório' })
      })
    })

    it('deve retornar todos os campos obrigatórios ausentes em uma única resposta [400]', () => {
      // A API valida com abortEarly: false — email e password vêm juntos
      serverestApi.postLogin({}).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({
          email: 'email é obrigatório',
          password: 'password é obrigatório',
        })
      })
    })
  })
})
