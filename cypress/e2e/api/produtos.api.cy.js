import * as serverestApi from '../../support/api/serverestApi'
import { buildProduct, buildNonexistentId } from '../../utils/dataFactory'
import { recordCreatedSchema } from '../../schemas/common.schema'
import { productSchema, productListSchema } from '../../schemas/produtos.schema'

describe('API | /produtos', () => {
  let admin
  let adminToken
  let commonUser
  let commonUserToken
  const createdProductIds = []

  before(() => {
    // Massa de setup: um administrador e um usuário comum, para exercitar
    // tanto autenticação (401) quanto autorização (403)
    cy.createUserViaApi({ administrador: 'true' }).then((user) => {
      admin = user
      cy.getAuthToken(admin).then((token) => {
        adminToken = token
      })
    })

    cy.createUserViaApi({ administrador: 'false' }).then((user) => {
      commonUser = user
      cy.getAuthToken(commonUser).then((token) => {
        commonUserToken = token
      })
    })
  })

  after(() => {
    if (adminToken) {
      createdProductIds.forEach((id) => serverestApi.deleteProduct(id, adminToken))
    }
    if (admin?.id) serverestApi.deleteUser(admin.id)
    if (commonUser?.id) serverestApi.deleteUser(commonUser.id)
  })

  context('Cenários positivos', () => {
    it('deve cadastrar um produto como administrador e consultá-lo pelo id (round-trip) [201/200]', () => {
      const product = buildProduct()

      serverestApi.postProduct(product, adminToken).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.eq('Cadastro realizado com sucesso')
        cy.validateSchema(response.body, recordCreatedSchema)

        const productId = response.body._id
        createdProductIds.push(productId)

        serverestApi.getProductById(productId).then((getResponse) => {
          expect(getResponse.status).to.eq(200)
          expect(getResponse.body).to.deep.include({ ...product, _id: productId })
          cy.validateSchema(getResponse.body, productSchema)
        })
      })
    })

    it('deve excluir um produto e confirmar a remoção [200]', () => {
      serverestApi.postProduct(buildProduct(), adminToken).then((createResponse) => {
        const productId = createResponse.body._id

        serverestApi.deleteProduct(productId, adminToken).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Registro excluído com sucesso')
        })

        serverestApi.getProductById(productId).then((getResponse) => {
          expect(getResponse.status).to.eq(400)
          expect(getResponse.body.message).to.eq('Produto não encontrado')
        })
      })
    })

    it('deve listar produtos e filtrar por nome, validando o contrato da lista [200]', () => {
      cy.createProductViaApi(adminToken).then((product) => {
        createdProductIds.push(product.id)

        serverestApi.getProducts({ nome: product.nome }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.quantidade).to.eq(1)
          expect(response.body.produtos[0]).to.deep.include({ nome: product.nome, _id: product.id })
          cy.validateSchema(response.body, productListSchema)
        })
      })
    })

    it('deve alterar um produto existente como administrador [200]', () => {
      cy.createProductViaApi(adminToken).then((product) => {
        createdProductIds.push(product.id)
        const updatedProduct = buildProduct()

        serverestApi.putProduct(product.id, updatedProduct, adminToken).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.message).to.eq('Registro alterado com sucesso')

          serverestApi.getProductById(product.id).then((getResponse) => {
            expect(getResponse.body).to.deep.include({ ...updatedProduct, _id: product.id })
          })
        })
      })
    })

    it('deve criar um novo produto ao fazer PUT em id inexistente (upsert) [201]', () => {
      const nonexistentId = buildNonexistentId()
      const product = buildProduct()

      serverestApi.putProduct(nonexistentId, product, adminToken).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.message).to.eq('Cadastro realizado com sucesso')
        cy.validateSchema(response.body, recordCreatedSchema)

        expect(response.body._id).to.not.eq(nonexistentId)
        createdProductIds.push(response.body._id)
      })
    })
  })

  context('Cenários negativos', () => {
    it('não deve cadastrar produto sem token de autenticação [401]', () => {
      serverestApi.postProduct(buildProduct()).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body.message).to.eq(
          'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        )
      })
    })

    it('não deve cadastrar produto com usuário sem perfil de administrador [403]', () => {
      // Distinção fundamental: 401 = falha de autenticação; 403 = usuário autenticado,
      // porém sem autorização para a rota
      serverestApi.postProduct(buildProduct(), commonUserToken).then((response) => {
        expect(response.status).to.eq(403)
        expect(response.body.message).to.eq('Rota exclusiva para administradores')
      })
    })

    it('não deve cadastrar produto com nome duplicado [400]', () => {
      const product = buildProduct()

      serverestApi.postProduct(product, adminToken).then((createResponse) => {
        createdProductIds.push(createResponse.body._id)

        serverestApi
          .postProduct({ ...buildProduct(), nome: product.nome }, adminToken)
          .then((response) => {
            expect(response.status).to.eq(400)
            expect(response.body.message).to.eq('Já existe produto com esse nome')
          })
      })
    })

    it('deve rejeitar produto com preço não positivo [400]', () => {
      serverestApi.postProduct(buildProduct({ preco: -10 }), adminToken).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({ preco: 'preco deve ser um número positivo' })
      })
    })

    it('deve validar todos os campos obrigatórios do produto em uma única resposta [400]', () => {
      serverestApi.postProduct({}, adminToken).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({
          nome: 'nome é obrigatório',
          preco: 'preco é obrigatório',
          descricao: 'descricao é obrigatório',
          quantidade: 'quantidade é obrigatório',
        })
      })
    })

    it('não deve alterar um produto para um nome já utilizado por outro [400]', () => {
      cy.createProductViaApi(adminToken).then((productA) => {
        createdProductIds.push(productA.id)

        cy.createProductViaApi(adminToken).then((productB) => {
          createdProductIds.push(productB.id)

          serverestApi
            .putProduct(productB.id, buildProduct({ nome: productA.nome }), adminToken)
            .then((response) => {
              expect(response.status).to.eq(400)
              expect(response.body.message).to.eq('Já existe produto com esse nome')
            })
        })
      })
    })

    it('não deve alterar produto sem token de autenticação [401]', () => {
      serverestApi.putProduct(buildNonexistentId(), buildProduct()).then((response) => {
        expect(response.status).to.eq(401)
        expect(response.body.message).to.eq(
          'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        )
      })
    })

    it('não deve alterar produto com usuário sem perfil de administrador [403]', () => {
      serverestApi
        .putProduct(buildNonexistentId(), buildProduct(), commonUserToken)
        .then((response) => {
          expect(response.status).to.eq(403)
          expect(response.body.message).to.eq('Rota exclusiva para administradores')
        })
    })

    it('deve retornar sucesso ao excluir um id de produto inexistente, sem remover nada [200]', () => {
      serverestApi.deleteProduct(buildNonexistentId(), adminToken).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message).to.eq('Nenhum registro excluído')
      })
    })

    it('não deve excluir um produto que faz parte de um carrinho [400]', () => {
      // Regra de dependência: um produto presente em algum carrinho não pode ser removido.
      // Usa um usuário dedicado para o carrinho, evitando ocupar o slot do admin compartilhado.
      cy.createProductViaApi(adminToken).then((product) => {
        createdProductIds.push(product.id)

        cy.createUserViaApi().then((cartUser) => {
          cy.getAuthToken(cartUser).then((cartToken) => {
            serverestApi
              .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] }, cartToken)
              .then((cartResponse) => {
                expect(cartResponse.status, 'setup: criação de carrinho').to.eq(201)

                serverestApi.deleteProduct(product.id, adminToken).then((response) => {
                  expect(response.status).to.eq(400)
                  expect(response.body.message).to.eq(
                    'Não é permitido excluir produto que faz parte de carrinho',
                  )
                  expect(response.body.idCarrinhos).to.include(cartResponse.body._id)
                })

                // Teardown local: libera o carrinho (para o produto poder ser removido
                // no after()) e remove o usuário auxiliar
                serverestApi.cancelarCompra(cartToken)
                serverestApi.deleteUser(cartUser.id)
              })
          })
        })
      })
    })
  })
})
