import * as serverestApi from '../../support/api/serverestApi'
import { buildProduct } from '../../utils/dataFactory'
import { recordCreatedSchema } from '../../schemas/common.schema'
import { productSchema } from '../../schemas/produtos.schema'

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
  })
})
