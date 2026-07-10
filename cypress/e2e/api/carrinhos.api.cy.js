import * as serverestApi from '../../support/api/serverestApi'
import { buildNonexistentId } from '../../utils/dataFactory'
import { recordCreatedSchema } from '../../schemas/common.schema'
import { cartSchema, cartListSchema } from '../../schemas/carrinhos.schema'

describe('API | /carrinhos', () => {
  let admin
  let adminToken
  let cartUser
  let cartToken
  const createdProductIds = []

  before(() => {
    // Administrador compartilhado apenas para criar produtos (rota exclusiva de admin)
    cy.createUserViaApi({ administrador: 'true' }).then((user) => {
      admin = user
      cy.getAuthToken(admin).then((token) => {
        adminToken = token
      })
    })
  })

  // Cada teste usa um dono de carrinho recém-criado: a regra de "1 carrinho por
  // usuário" torna o estado por-teste a forma mais limpa de garantir isolamento.
  beforeEach(() => {
    cy.createUserViaApi({ administrador: 'false' }).then((user) => {
      cartUser = user
      cy.getAuthToken(cartUser).then((token) => {
        cartToken = token
      })
    })
  })

  afterEach(() => {
    // Cancela um eventual carrinho remanescente (idempotente: sem carrinho → 200)
    // para liberar a exclusão do usuário e dos produtos
    if (cartToken) serverestApi.cancelarCompra(cartToken)
    if (cartUser?.id) serverestApi.deleteUser(cartUser.id)
  })

  after(() => {
    if (adminToken) {
      createdProductIds.forEach((id) => serverestApi.deleteProduct(id, adminToken))
    }
    if (admin?.id) serverestApi.deleteUser(admin.id)
  })

  context('Cenários positivos', () => {
    it('deve criar um carrinho autenticado e consultá-lo pelo id (round-trip) [201/200]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 2 }] }, cartToken)
          .then((response) => {
            expect(response.status).to.eq(201)
            expect(response.body.message).to.eq('Cadastro realizado com sucesso')
            cy.validateSchema(response.body, recordCreatedSchema)

            const cartId = response.body._id

            serverestApi.getCartById(cartId).then((getResponse) => {
              expect(getResponse.status).to.eq(200)
              expect(getResponse.body._id).to.eq(cartId)
              expect(getResponse.body.idUsuario).to.eq(cartUser.id)
              expect(getResponse.body.quantidadeTotal).to.eq(2)
              expect(getResponse.body.precoTotal).to.eq(product.preco * 2)
              expect(getResponse.body.produtos[0]).to.deep.eq({
                idProduto: product.id,
                quantidade: 2,
                precoUnitario: product.preco,
              })
              cy.validateSchema(getResponse.body, cartSchema)
            })
          })
      })
    })

    it('deve reduzir o estoque do produto ao criar o carrinho [201]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 3 }] }, cartToken)
          .then((response) => {
            expect(response.status).to.eq(201)

            // Efeito colateral: o estoque disponível cai de 10 para 7
            serverestApi.getProductById(product.id).then((getResponse) => {
              expect(getResponse.body.quantidade).to.eq(7)
            })
          })
      })
    })

    it('deve listar os carrinhos e validar o contrato da lista (rota pública) [200]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] }, cartToken)
          .then(() => {
            serverestApi.getCarts().then((response) => {
              expect(response.status).to.eq(200)
              expect(response.body.quantidade).to.be.a('number')
              cy.validateSchema(response.body, cartListSchema)
            })
          })
      })
    })

    it('deve concluir a compra, remover o carrinho e MANTER o estoque baixado [200]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 4 }] }, cartToken)
          .then((cartResponse) => {
            const cartId = cartResponse.body._id

            serverestApi.concluirCompra(cartToken).then((response) => {
              expect(response.status).to.eq(200)
              expect(response.body.message).to.eq('Registro excluído com sucesso')
            })

            // Carrinho deixa de existir
            serverestApi.getCartById(cartId).then((getResponse) => {
              expect(getResponse.status).to.eq(400)
              expect(getResponse.body.message).to.eq('Carrinho não encontrado')
            })

            // Compra concluída: o estoque permanece reduzido (10 - 4 = 6)
            serverestApi.getProductById(product.id).then((getResponse) => {
              expect(getResponse.body.quantidade).to.eq(6)
            })
          })
      })
    })

    it('deve cancelar a compra, remover o carrinho e REABASTECER o estoque [200]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 4 }] }, cartToken)
          .then((cartResponse) => {
            const cartId = cartResponse.body._id

            serverestApi.cancelarCompra(cartToken).then((response) => {
              expect(response.status).to.eq(200)
              expect(response.body.message).to.eq(
                'Registro excluído com sucesso. Estoque dos produtos reabastecido',
              )
            })

            serverestApi.getCartById(cartId).then((getResponse) => {
              expect(getResponse.status).to.eq(400)
            })

            // Compra cancelada: o estoque volta ao valor original (6 → 10)
            serverestApi.getProductById(product.id).then((getResponse) => {
              expect(getResponse.body.quantidade).to.eq(10)
            })
          })
      })
    })
  })

  context('Cenários negativos', () => {
    it('não deve criar carrinho sem token de autenticação [401]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] })
          .then((response) => {
            expect(response.status).to.eq(401)
            expect(response.body.message).to.eq(
              'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
            )
          })
      })
    })

    it('não deve criar carrinho com produto inexistente [400]', () => {
      const nonexistentProductId = buildNonexistentId()

      serverestApi
        .postCart({ produtos: [{ idProduto: nonexistentProductId, quantidade: 1 }] }, cartToken)
        .then((response) => {
          expect(response.status).to.eq(400)
          expect(response.body.message).to.eq('Produto não encontrado')
        })
    })

    it('não deve criar carrinho com quantidade maior que o estoque [400]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 5 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 10 }] }, cartToken)
          .then((response) => {
            expect(response.status).to.eq(400)
            expect(response.body.message).to.eq('Produto não possui quantidade suficiente')
          })
      })
    })

    it('não deve criar carrinho com produtos duplicados [400]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart(
            {
              produtos: [
                { idProduto: product.id, quantidade: 1 },
                { idProduto: product.id, quantidade: 2 },
              ],
            },
            cartToken,
          )
          .then((response) => {
            expect(response.status).to.eq(400)
            expect(response.body.message).to.eq('Não é permitido possuir produto duplicado')
            expect(response.body.idProdutosDuplicados).to.include(product.id)
          })
      })
    })

    it('não deve permitir mais de um carrinho por usuário [400]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        // Primeiro carrinho é criado com sucesso
        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] }, cartToken)
          .then((first) => {
            expect(first.status).to.eq(201)

            // Segundo carrinho para o mesmo usuário é rejeitado
            serverestApi
              .postCart({ produtos: [{ idProduto: product.id, quantidade: 1 }] }, cartToken)
              .then((response) => {
                expect(response.status).to.eq(400)
                expect(response.body.message).to.eq('Não é permitido ter mais de 1 carrinho')
              })
          })
      })
    })

    it('deve rejeitar quantidade não positiva pela validação de schema [400]', () => {
      cy.createProductViaApi(adminToken, { quantidade: 10 }).then((product) => {
        createdProductIds.push(product.id)

        serverestApi
          .postCart({ produtos: [{ idProduto: product.id, quantidade: 0 }] }, cartToken)
          .then((response) => {
            expect(response.status).to.eq(400)
            expect(response.body).to.have.property(
              'produtos[0].quantidade',
              'produtos[0].quantidade deve ser um número positivo',
            )
          })
      })
    })

    it('deve rejeitar carrinho com a lista de produtos vazia [400]', () => {
      serverestApi.postCart({ produtos: [] }, cartToken).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body).to.deep.eq({ produtos: 'produtos não contém 1 valor obrigatório' })
      })
    })

    it('deve retornar erro ao consultar carrinho por id inexistente [400]', () => {
      serverestApi.getCartById(buildNonexistentId()).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.message).to.eq('Carrinho não encontrado')
      })
    })

    it('deve informar ausência de carrinho ao concluir compra sem tê-lo [200]', () => {
      // Sem carrinho a operação não é um erro: a API responde 200 informando o estado
      serverestApi.concluirCompra(cartToken).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.message).to.eq('Não foi encontrado carrinho para esse usuário')
      })
    })
  })
})
