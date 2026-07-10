import { registerProductPage, productListPage } from '../../pages/ProductPages'
import { buildProduct } from '../../utils/dataFactory'
import * as serverestApi from '../../support/api/serverestApi'

describe('Frontend | Produtos', () => {
  let admin

  before(() => {
    cy.createUserViaApi({ administrador: 'true' }).then((user) => {
      admin = user
    })
  })

  after(() => {
    if (admin?.id) serverestApi.deleteUser(admin.id)
  })

  context('Cenário 6: cadastro de produto pelo administrador', () => {
    const product = buildProduct()

    after(() => {
      // O id não é exposto na UI: localiza o produto criado pelo nome para remoção
      if (!admin?.id) return

      cy.getAuthToken(admin).then((token) => {
        serverestApi.getProducts({ nome: product.nome }).then(({ body }) => {
          const createdProduct = body.produtos?.[0]
          if (createdProduct) {
            serverestApi.deleteProduct(createdProduct._id, token)
          }
        })
      })
    })

    it('deve cadastrar um novo produto e exibi-lo na listagem', () => {
      cy.loginViaUi(admin)

      registerProductPage.visit().fillForm(product).submit()

      productListPage.assertProductIsListed(product)
      cy.screenshot('cenario-6-produto-cadastrado-listagem')
    })
  })

  context('Cenário 7: cadastro de produto com nome duplicado', () => {
    let existingProduct

    before(() => {
      // Pré-condição criada via API: um produto já existente na base
      cy.getAuthToken(admin).then((token) => {
        const product = buildProduct()
        serverestApi.postProduct(product, token).then((response) => {
          expect(response.status, 'setup: criação de produto via API').to.eq(201)
          existingProduct = { ...product, id: response.body._id }
        })
      })
    })

    after(() => {
      if (!admin?.id || !existingProduct?.id) return

      cy.getAuthToken(admin).then((token) => {
        serverestApi.deleteProduct(existingProduct.id, token)
      })
    })

    it('deve exibir mensagem de erro e não duplicar o produto', () => {
      cy.loginViaUi(admin)

      registerProductPage
        .visit()
        .fillForm(buildProduct({ nome: existingProduct.nome }))
        .submit()

      registerProductPage.assertRegisterError('Já existe produto com esse nome')
      cy.url().should('include', '/admin/cadastrarprodutos')
      cy.screenshot('cenario-7-produto-duplicado-erro')
    })
  })
})
