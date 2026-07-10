import * as serverestApi from '../../support/api/serverestApi'
import { buildUser, buildNonexistentId } from '../../utils/dataFactory'
import { recordCreatedSchema } from '../../schemas/common.schema'
import { userSchema, userListSchema } from '../../schemas/usuarios.schema'

describe('API | /usuarios', () => {
  const createdUserIds = []

  after(() => {
    // Teardown centralizado: remove toda a massa criada pelos testes deste spec
    createdUserIds.forEach((id) => serverestApi.deleteUser(id))
  })

  context('Cenários positivos', () => {
    it('deve cadastrar um usuário e consultá-lo pelo id (round-trip) [201/200]', () => {
      const user = buildUser()

      serverestApi.postUser(user).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.eq('Cadastro realizado com sucesso')
        cy.validateSchema(response.body, recordCreatedSchema)

        const userId = response.body._id
        createdUserIds.push(userId)

        // Round-trip: valida que o recurso foi de fato persistido com os dados enviados
        serverestApi.getUserById(userId).then((getResponse) => {
          expect(getResponse.status).to.eq(200)
          expect(getResponse.body).to.deep.eq({ ...user, _id: userId })
          cy.validateSchema(getResponse.body, userSchema)
        })
      })
    })

    it('deve listar usuários e filtrar por email, validando o contrato da lista [200]', () => {
      cy.createUserViaApi().then((user) => {
        createdUserIds.push(user.id)

        // Filtro por query string deve retornar exatamente o usuário criado
        serverestApi.getUsers({ email: user.email }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.quantidade).to.eq(1)

          const { id, ...fields } = user
          expect(response.body.usuarios[0]).to.deep.eq({ ...fields, _id: id })
          cy.validateSchema(response.body, userListSchema)
        })
      })
    })

    it('deve criar um novo usuário ao fazer PUT em id inexistente (upsert) [201]', () => {
      const newUser = buildUser()
      const nonexistentId = buildNonexistentId()

      serverestApi.putUser(nonexistentId, newUser).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.eq('Cadastro realizado com sucesso')
        cy.validateSchema(response.body, recordCreatedSchema)

        // O id é gerado pela API — não reaproveita o valor inexistente enviado na URL
        expect(response.body._id).to.not.eq(nonexistentId)
        createdUserIds.push(response.body._id)
      })
    })

    it('deve alterar os dados de um usuário existente [200]', () => {
      cy.createUserViaApi().then((user) => {
        createdUserIds.push(user.id)
        const updatedUser = buildUser({ email: user.email })

        serverestApi.putUser(user.id, updatedUser).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Registro alterado com sucesso')

          serverestApi.getUserById(user.id).then((getResponse) => {
            expect(getResponse.body.nome).to.eq(updatedUser.nome)
          })
        })
      })
    })

    it('deve excluir um usuário e confirmar a remoção [200]', () => {
      cy.createUserViaApi().then((user) => {
        serverestApi.deleteUser(user.id).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Registro excluído com sucesso')
        })

        // Confirmação da exclusão: consulta subsequente não deve encontrar o registro
        serverestApi.getUserById(user.id).then((getResponse) => {
          expect(getResponse.status).to.eq(400)
          expect(getResponse.body.message).to.eq('Usuário não encontrado')
        })
      })
    })
  })

  context('Cenários negativos', () => {
    it('não deve cadastrar usuário com email já utilizado [400]', () => {
      cy.createUserViaApi().then((existingUser) => {
        createdUserIds.push(existingUser.id)

        serverestApi.postUser(buildUser({ email: existingUser.email })).then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.message).to.eq('Este email já está sendo usado')
          expect(response.body).to.not.have.property('_id')
        })
      })
    })

    it('deve validar todos os campos obrigatórios em uma única resposta [400]', () => {
      // A API usa abortEarly: false — todos os erros de campo retornam juntos
      serverestApi.postUser({}).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({
          nome: 'nome é obrigatório',
          email: 'email é obrigatório',
          password: 'password é obrigatório',
          administrador: 'administrador é obrigatório',
        })
      })
    })

    it("não deve aceitar valor de administrador diferente de 'true' ou 'false' [400]", () => {
      serverestApi.postUser(buildUser({ administrador: 'talvez' })).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({
          administrador: "administrador deve ser 'true' ou 'false'",
        })
      })
    })

    it('deve retornar erro ao consultar id válido porém inexistente [400]', () => {
      serverestApi.getUserById(buildNonexistentId()).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.message).to.eq('Usuário não encontrado')
      })
    })

    it('não deve alterar um usuário para um email já utilizado por outro [400]', () => {
      cy.createUserViaApi().then((userA) => {
        createdUserIds.push(userA.id)

        cy.createUserViaApi().then((userB) => {
          createdUserIds.push(userB.id)

          // Tenta alterar B atribuindo o email já pertencente a A
          serverestApi.putUser(userB.id, buildUser({ email: userA.email })).then((response) => {
            expect(response.status).to.eq(400)
            expect(response.body.message).to.eq('Este email já está sendo usado')
          })
        })
      })
    })

    it('deve retornar sucesso ao excluir um id inexistente, sem remover nada [200]', () => {
      // Comportamento contraintuitivo, porém fiel ao contrato: DELETE de id inexistente
      // não é erro — a API responde 200 informando que nada foi excluído
      serverestApi.deleteUser(buildNonexistentId()).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message).to.eq('Nenhum registro excluído')
      })
    })

    it('não deve excluir um usuário que possui carrinho cadastrado [400]', () => {
      // Regra de dependência: um usuário com carrinho não pode ser removido
      cy.createUserViaApi({ administrador: 'true' }).then((user) => {
        createdUserIds.push(user.id)

        cy.getAuthToken(user).then((token) => {
          cy.createProductViaApi(token).then((product) => {
            serverestApi
              .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] }, token)
              .then((cartResponse) => {
                expect(cartResponse.status, 'setup: criação de carrinho').to.eq(201)

                serverestApi.deleteUser(user.id).then((response) => {
                  expect(response.status).to.eq(400)
                  expect(response.body.message).to.eq(
                    'Não é permitido excluir usuário com carrinho cadastrado',
                  )
                  expect(response.body.idCarrinho).to.eq(cartResponse.body._id)
                })

                // Teardown local: libera o carrinho e o produto para que o usuário
                // possa ser removido no hook after() centralizado
                serverestApi.cancelarCompra(token)
                serverestApi.deleteProduct(product.id, token)
              })
          })
        })
      })
    })
  })
})
