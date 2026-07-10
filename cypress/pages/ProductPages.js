/**
 * Page Object Model — Cadastro e Listagem de Produtos (área administrativa)
 */
class RegisterProductPage {
  elements = {
    nameInput: () => cy.get('[data-testid="nome"]'),
    priceInput: () => cy.get('[data-testid="preco"]'),
    descriptionInput: () => cy.get('[data-testid="descricao"]'),
    quantityInput: () => cy.get('[data-testid="quantity"]'),
    // O data-testid reflete o atributo real da aplicação (contém um typo no fonte original)
    submitButton: () => cy.get('[data-testid="cadastarProdutos"]'),
    errorAlert: () => cy.get('.alert'),
  }

  visit() {
    cy.visit('/admin/cadastrarprodutos')
    return this
  }

  fillForm({ nome, preco, descricao, quantidade }) {
    this.elements.nameInput().clear().type(nome)
    this.elements.priceInput().clear().type(preco)
    this.elements.descriptionInput().clear().type(descricao)
    this.elements.quantityInput().clear().type(quantidade)
    return this
  }

  submit() {
    this.elements.submitButton().click()
    return this
  }

  assertRegisterError(message) {
    this.elements.errorAlert().should('be.visible').and('contain.text', message)
    return this
  }
}

class ProductListPage {
  elements = {
    table: () => cy.get('table'),
    rowByProductName: (name) => cy.contains('td', name).parent('tr'),
  }

  assertProductIsListed({ nome, preco, quantidade }) {
    cy.url().should('include', '/admin/listarprodutos')
    this.elements
      .rowByProductName(nome)
      .should('be.visible')
      .within(() => {
        cy.contains('td', nome).should('be.visible')
        cy.contains('td', String(preco)).should('be.visible')
        cy.contains('td', String(quantidade)).should('be.visible')
      })
    return this
  }
}

export const registerProductPage = new RegisterProductPage()
export const productListPage = new ProductListPage()
